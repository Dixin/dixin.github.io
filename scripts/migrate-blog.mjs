#!/usr/bin/env node
/**
 * Migration script to fetch blog posts from weblogs.asp.net/dixin
 * and convert them to Markdown files for the Fuwari (Astro) blog.
 * 
 * Usage: node scripts/migrate-blog.mjs
 * 
 * This script must be run locally where you have access to weblogs.asp.net
 */

import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const OUTPUT_DIR = './src/content/posts';
const BLOG_BASE_URL = 'https://weblogs.asp.net/dixin';
const TOTAL_PAGES = 15;

// Initialize Turndown for HTML to Markdown conversion
const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    fence: '```',
    bulletListMarker: '-',
    hr: '---',
});

// Use GitHub Flavored Markdown plugin
turndownService.use(gfm);

// Custom rule for "code" elements
turndownService.addRule('codeElement', {
    filter: function (node) {
        return node.nodeName === 'CODE';
    },
    replacement: function (content, node) {
        // Check if it's inside a PRE (block code) or inline
        if (node.parentNode && node.parentNode.nodeName === 'PRE') {
            const language = detectLanguage(node);
            const code = node.textContent;
            return `\n\`\`\`${language}\n${code}\n\`\`\`\n`;
        }
        // Inline code
        return `\`${node.textContent}\``;
    }
});

// Custom rule for single "pre" element with class "code"
turndownService.addRule('preCodeBlock', {
    filter: function (node) {
        return (
            node.nodeName === 'PRE' &&
            node.classList.contains('code')
        );
    },
    replacement: function (content, node) {
        const text = node.textContent;
        const language = detectLanguageFromContent(text);
        return `\n\`\`\`${language}\n${text.trim()}\n\`\`\`\n`;
    }
});

// Custom rule for consecutive "p" elements with class "CodeCxSpMiddle"
turndownService.addRule('codeCxSpMiddle', {
    filter: function (node) {
        return (
            node.nodeName === 'P' &&
            node.classList.contains('CodeCxSpMiddle')
        );
    },
    replacement: function (content, node) {
        // Check if this is the first in a sequence
        const prevSibling = node.previousElementSibling;
        const isFirst = !prevSibling || !prevSibling.classList.contains('CodeCxSpMiddle');
        
        // Check if this is the last in a sequence
        const nextSibling = node.nextElementSibling;
        const isLast = !nextSibling || !nextSibling.classList.contains('CodeCxSpMiddle');
        
        const lineText = node.textContent;
        
        if (isFirst && isLast) {
            // Single line code block
            const language = detectLanguageFromContent(lineText);
            return `\n\`\`\`${language}\n${lineText}\n\`\`\`\n`;
        } else if (isFirst) {
            // First line - collect all consecutive lines
            let codeLines = [lineText];
            let current = node.nextElementSibling;
            while (current && current.classList.contains('CodeCxSpMiddle')) {
                codeLines.push(current.textContent);
                current = current.nextElementSibling;
            }
            const fullCode = codeLines.join('\n');
            const language = detectLanguageFromContent(fullCode);
            return `\n\`\`\`${language}\n${fullCode}\n\`\`\`\n`;
        } else {
            // Not the first line - skip (already processed by first line)
            return '';
        }
    }
});

function detectLanguage(codeNode) {
    if (!codeNode) return '';
    
    // Check class for language hints
    const classes = codeNode.className || '';
    if (classes.includes('csharp') || classes.includes('cs')) return 'csharp';
    if (classes.includes('javascript') || classes.includes('js')) return 'javascript';
    if (classes.includes('typescript') || classes.includes('ts')) return 'typescript';
    if (classes.includes('python')) return 'python';
    if (classes.includes('sql')) return 'sql';
    if (classes.includes('xml') || classes.includes('html')) return 'html';
    if (classes.includes('json')) return 'json';
    if (classes.includes('bash') || classes.includes('shell')) return 'bash';
    if (classes.includes('powershell')) return 'powershell';
    
    return detectLanguageFromContent(codeNode.textContent);
}

function detectLanguageFromContent(text) {
    if (!text) return '';
    
    // Simple heuristics for language detection - prioritize C# for this blog
    if (text.includes('namespace ') || text.includes('using System') || text.includes('public class ') || text.includes('private ') || text.includes('protected ')) return 'csharp';
    if (text.includes('function ') && text.includes('const ')) return 'javascript';
    // More specific TypeScript detection
    if ((text.includes('interface ') && text.includes('{') && text.includes(': ')) || 
        text.includes('export interface ') || 
        text.includes(': string') || 
        text.includes(': number') ||
        text.includes(': boolean')) return 'typescript';
    if (text.includes('SELECT ') || text.includes('FROM ') || text.includes('WHERE ')) return 'sql';
    if (text.includes('<?xml') || text.includes('<html')) return 'xml';
    if (text.includes('def ') && text.includes(':') && !text.includes(';')) return 'python';
    
    return '';
}

function getFilenameFromUrl(url) {
    // Extract the last segment of the URL as the filename
    // e.g., "https://weblogs.asp.net/dixin/entity-framework-and-linq-to-entities-3-logging" 
    // returns "entity-framework-and-linq-to-entities-3-logging"
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const segments = pathname.split('/').filter(s => s.length > 0);
    return segments[segments.length - 1] || 'untitled';
}

function normalizeHeaderLevels(doc, contentElement) {
    // Get all header elements in content
    const headers = contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headers.length === 0) {
        return; // No headers, nothing to do
    }
    
    // Find the highest (smallest number) header level present
    let minLevel = 7;
    headers.forEach(h => {
        const level = parseInt(h.tagName.substring(1), 10);
        if (level < minLevel) {
            minLevel = level;
        }
    });
    
    if (minLevel === 2) {
        return; // Already h2 is the highest, nothing to do
    }
    
    // Calculate the adjustment needed to make highest level = h2
    const adjustment = 2 - minLevel; // positive = downgrade, negative = upgrade
    
    // Process headers from h6 down to h1 if downgrading (adjustment > 0)
    // Process headers from h1 up to h6 if upgrading (adjustment < 0)
    if (adjustment > 0) {
        // Downgrade: process from highest number to lowest to avoid conflicts
        for (let level = 6; level >= 1; level--) {
            const headersAtLevel = contentElement.querySelectorAll(`h${level}`);
            headersAtLevel.forEach(h => {
                const newLevel = Math.min(level + adjustment, 6); // Cap at h6
                const newHeader = doc.createElement(`h${newLevel}`);
                newHeader.innerHTML = h.innerHTML;
                // Copy attributes
                for (const attr of h.attributes) {
                    newHeader.setAttribute(attr.name, attr.value);
                }
                h.parentNode.replaceChild(newHeader, h);
            });
        }
    } else if (adjustment < 0) {
        // Upgrade: process from lowest number to highest to avoid conflicts
        for (let level = 1; level <= 6; level++) {
            const headersAtLevel = contentElement.querySelectorAll(`h${level}`);
            headersAtLevel.forEach(h => {
                const newLevel = Math.max(level + adjustment, 1); // Floor at h1
                const newHeader = doc.createElement(`h${newLevel}`);
                newHeader.innerHTML = h.innerHTML;
                // Copy attributes
                for (const attr of h.attributes) {
                    newHeader.setAttribute(attr.name, attr.value);
                }
                h.parentNode.replaceChild(newHeader, h);
            });
        }
    }
}

async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.text();
        } catch (error) {
            console.warn(`Attempt ${i + 1} failed for ${url}: ${error.message}`);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

async function fetchPostUrlsFromPage(pageNum) {
    const url = `${BLOG_BASE_URL}?page=${pageNum}`;
    console.log(`Fetching post URLs from page ${pageNum}:`, url);
    
    const html = await fetchWithRetry(url);
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    const postUrls = [];
    
    // Find all post links on the page
    const links = doc.querySelectorAll('ul.blog-posts li h2 a');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !postUrls.includes(href)) {
            // Handle relative URLs
            const fullUrl = href.startsWith('http') ? href : `https://weblogs.asp.net${href}`;
            postUrls.push(fullUrl);
        }
    });
    
    console.log(`  Found ${postUrls.length} post URLs on page ${pageNum}`);
    return postUrls;
}

async function fetchAllPostUrls() {
    console.log(`Fetching post URLs from ${TOTAL_PAGES} pages...`);
    const allUrls = [];
    
    for (let page = 1; page <= TOTAL_PAGES; page++) {
        try {
            const urls = await fetchPostUrlsFromPage(page);
            urls.forEach(url => {
                if (!allUrls.includes(url)) {
                    allUrls.push(url);
                }
            });
            
            // Rate limiting between page fetches
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`Failed to fetch page ${page}:`, error.message);
        }
    }
    
    console.log(`\nTotal unique post URLs found: ${allUrls.length}`);
    return allUrls;
}

async function fetchPostData(url) {
    console.log('Fetching post:', url);
    const html = await fetchWithRetry(url);
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    // Extract post title
    let title = '';
    const titleEl = doc.querySelector('article.blog-post header h1');
    if (titleEl && titleEl.textContent.trim()) {
        title = titleEl.textContent.trim();
    }
    
    // Extract post date
    let pubDate = new Date();
    const dateEl = doc.querySelector('article.blog-post header .metadata time');
    if (dateEl) {
        const dateText = dateEl.getAttribute('datetime') || dateEl.textContent;
        const parsedDate = new Date(dateText);
        if (!isNaN(parsedDate.getTime())) {
            pubDate = parsedDate;
        }
    }
    
    // Extract categories/tags
    const categories = [];
    const tagsContainer = doc.querySelector('article.blog-post header .tags');
    if (tagsContainer) {
        const tagLinks = tagsContainer.querySelectorAll('a');
        tagLinks.forEach(el => {
            const cat = el.textContent.trim();
            if (cat && !categories.includes(cat)) {
                categories.push(cat);
            }
        });
    }
    
    // Remove header before getting content
    const header = doc.querySelector('article.blog-post header');
    if (header) {
        header.remove();
    }
    
    // Get post content
    const content = doc.querySelector('article.blog-post');
    
    if (!content) {
        console.warn('Could not find content for:', url);
        return null;
    }
    
    // Remove unwanted elements
    const elementsToRemove = content.querySelectorAll('script, style, .comments, #comments, .share, .social, .related-posts, .navigation, .nav');
    elementsToRemove.forEach(el => el.remove());
    
    // Normalize header levels so highest is h2
    normalizeHeaderLevels(doc, content);
    
    return {
        title: title || 'Untitled',
        link: url,
        pubDate,
        description: '',
        categories,
        htmlContent: content.innerHTML,
    };
}

function htmlToMarkdown(html) {
    if (!html) return '';
    
    // Pre-process: fix common issues
    html = html
        // Fix nbsp and other entities
        .replace(/&nbsp;/g, ' ')
        // Fix line breaks
        .replace(/<br\s*\/?>/gi, '\n');
    
    // Convert to Markdown
    let markdown = turndownService.turndown(html);
    
    // Post-process: clean up
    markdown = markdown
        // Remove excessive blank lines
        .replace(/\n{3,}/g, '\n\n')
        // Fix code block spacing
        .replace(/```(\w+)\n\n/g, '```$1\n')
        .replace(/\n\n```\n/g, '\n```\n')
        // Trim
        .trim();
    
    return markdown;
}

function createFrontmatter(post, markdown) {
    const date = post.pubDate.toISOString().split('T')[0];
    const tags = post.categories.length > 0 ? post.categories : ['Blog'];
    const category = post.categories[0] || '';
    
    // Create description from first paragraph if not provided
    let description = post.description;
    if (!description || description.length < 10) {
        const firstParagraph = markdown.match(/^[^#\n][^\n]+/m);
        description = firstParagraph 
            ? firstParagraph[0].substring(0, 200).replace(/\[.*?\]\(.*?\)/g, '').trim()
            : '';
    }
    
    // Escape quotes in description and title
    description = description.replace(/"/g, '\\"').replace(/\n/g, ' ').substring(0, 200);
    const title = post.title.replace(/"/g, '\\"');
    
    return `---
title: "${title}"
published: ${date}
description: "${description}"
image: ""
tags: [${tags.map(t => `"${t}"`).join(', ')}]
category: "${category}"
draft: false
lang: ""
---
`;
}

async function migratePostFromUrl(url) {
    const postData = await fetchPostData(url);
    if (!postData) {
        console.warn('Skipping post with no content:', url);
        return false;
    }
    
    const filename = getFilenameFromUrl(url);
    const outputPath = path.join(OUTPUT_DIR, `${filename}.md`);
    
    // Skip if file already exists
    if (fs.existsSync(outputPath)) {
        console.log('Skipping existing post:', filename);
        return false;
    }
    
    const markdown = htmlToMarkdown(postData.htmlContent);
    const frontmatter = createFrontmatter(postData, markdown);
    const fullContent = frontmatter + '\n' + markdown;
    
    fs.writeFileSync(outputPath, fullContent, 'utf-8');
    console.log('Created:', outputPath);
    return true;
}

async function main() {
    console.log('Starting blog migration from weblogs.asp.net/dixin');
    console.log('Output directory:', OUTPUT_DIR);
    
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    try {
        // Fetch all post URLs by paginating through the blog pages
        const postUrls = await fetchAllPostUrls();
        
        let migrated = 0;
        let skipped = 0;
        let failed = 0;
        
        for (const url of postUrls) {
            try {
                const result = await migratePostFromUrl(url);
                if (result) {
                    migrated++;
                } else {
                    skipped++;
                }
            } catch (error) {
                console.error(`Failed to migrate "${url}":`, error.message);
                failed++;
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log('\n=== Migration Complete ===');
        console.log(`Migrated: ${migrated}`);
        console.log(`Skipped: ${skipped}`);
        console.log(`Failed: ${failed}`);
        console.log(`Total: ${postUrls.length}`);
        
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

main();
