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

const BLOG_URL = 'https://weblogs.asp.net/dixin';
const OUTPUT_DIR = './src/content/posts';
const RSS_URL = 'https://weblogs.asp.net/dixin/rss.aspx';

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

// Custom rule for code blocks with language detection
turndownService.addRule('codeBlocks', {
    filter: function (node) {
        return (
            node.nodeName === 'PRE' &&
            node.querySelector('code')
        );
    },
    replacement: function (content, node) {
        const codeNode = node.querySelector('code');
        const language = detectLanguage(codeNode);
        const code = codeNode.textContent;
        return `\n\`\`\`${language}\n${code}\n\`\`\`\n`;
    }
});

// Custom rule for highlighted code (often wrapped in spans)
turndownService.addRule('highlightedCode', {
    filter: function (node) {
        return (
            node.nodeName === 'DIV' &&
            (node.classList.contains('code') || 
             node.classList.contains('csharpcode') ||
             node.querySelector('.csharpcode'))
        );
    },
    replacement: function (content, node) {
        const text = node.textContent;
        const language = detectLanguageFromContent(text);
        return `\n\`\`\`${language}\n${text.trim()}\n\`\`\`\n`;
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
    
    // Simple heuristics for language detection
    if (text.includes('namespace ') || text.includes('using System') || text.includes('public class ')) return 'csharp';
    if (text.includes('function ') && text.includes('const ')) return 'javascript';
    if (text.includes('interface ') && text.includes(': ')) return 'typescript';
    if (text.includes('SELECT ') || text.includes('FROM ') || text.includes('WHERE ')) return 'sql';
    if (text.includes('<?xml') || text.includes('<html')) return 'xml';
    if (text.includes('def ') && text.includes(':')) return 'python';
    
    return '';
}

function sanitizeFilename(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100);
}

function extractCategories(html) {
    const categories = [];
    const dom = new JSDOM(html);
    const categoryLinks = dom.window.document.querySelectorAll('.post-categories a, .categories a, .category a');
    categoryLinks.forEach(link => {
        categories.push(link.textContent.trim());
    });
    return categories;
}

function extractTags(html) {
    const tags = [];
    const dom = new JSDOM(html);
    const tagLinks = dom.window.document.querySelectorAll('.post-tags a, .tags a, .tag a');
    tagLinks.forEach(link => {
        tags.push(link.textContent.trim());
    });
    return tags;
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

async function fetchRSSFeed() {
    console.log('Fetching RSS feed from:', RSS_URL);
    const xml = await fetchWithRetry(RSS_URL);
    const dom = new JSDOM(xml, { contentType: 'text/xml' });
    const items = dom.window.document.querySelectorAll('item');
    
    const posts = [];
    items.forEach(item => {
        const title = item.querySelector('title')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '';
        const pubDate = item.querySelector('pubDate')?.textContent || '';
        const description = item.querySelector('description')?.textContent || '';
        const categories = Array.from(item.querySelectorAll('category')).map(c => c.textContent);
        
        posts.push({
            title,
            link,
            pubDate: new Date(pubDate),
            description,
            categories,
        });
    });
    
    console.log(`Found ${posts.length} posts in RSS feed`);
    return posts;
}

async function fetchPostContent(url) {
    console.log('Fetching post:', url);
    const html = await fetchWithRetry(url);
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    // Try to find the post content - common selectors for ASP.NET blogs
    const contentSelectors = [
        '.entry-content',
        '.post-content',
        '.article-content',
        '.content',
        '#content',
        'article',
        '.post-body',
        '.itemBody',
    ];
    
    let content = null;
    for (const selector of contentSelectors) {
        content = doc.querySelector(selector);
        if (content && content.innerHTML.trim().length > 100) break;
    }
    
    if (!content) {
        console.warn('Could not find content for:', url);
        return null;
    }
    
    // Remove unwanted elements
    const elementsToRemove = content.querySelectorAll('script, style, .comments, #comments, .share, .social, .related-posts, .navigation, .nav');
    elementsToRemove.forEach(el => el.remove());
    
    return content.innerHTML;
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

async function migratePost(post) {
    const filename = sanitizeFilename(post.title);
    const outputPath = path.join(OUTPUT_DIR, `${filename}.md`);
    
    // Skip if file already exists
    if (fs.existsSync(outputPath)) {
        console.log('Skipping existing post:', filename);
        return false;
    }
    
    const htmlContent = await fetchPostContent(post.link);
    if (!htmlContent) {
        console.warn('Skipping post with no content:', post.title);
        return false;
    }
    
    const markdown = htmlToMarkdown(htmlContent);
    const frontmatter = createFrontmatter(post, markdown);
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
        const posts = await fetchRSSFeed();
        
        let migrated = 0;
        let skipped = 0;
        let failed = 0;
        
        for (const post of posts) {
            try {
                const result = await migratePost(post);
                if (result) {
                    migrated++;
                } else {
                    skipped++;
                }
            } catch (error) {
                console.error(`Failed to migrate "${post.title}":`, error.message);
                failed++;
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log('\n=== Migration Complete ===');
        console.log(`Migrated: ${migrated}`);
        console.log(`Skipped: ${skipped}`);
        console.log(`Failed: ${failed}`);
        console.log(`Total: ${posts.length}`);
        
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

main();
