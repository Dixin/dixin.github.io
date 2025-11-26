# Blog Migration Guide

This document explains how to migrate blog posts from the old weblogs.asp.net/dixin blog to this new Fuwari-based blog.

## Prerequisites

Before running the migration script, ensure you have:

1. Node.js 20 or later installed
2. pnpm package manager installed
3. Access to the old blog at https://weblogs.asp.net/dixin

## Migration Steps

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Run the Migration Script

```bash
pnpm migrate-blog
```

This script will:
- Fetch post URLs by paginating through all 15 blog listing pages (https://weblogs.asp.net/dixin?page=1 through page=15)
- Download each blog post
- Convert HTML content to Markdown
- Generate proper frontmatter with:
  - Title
  - Published date
  - Description (auto-extracted if not available)
  - Categories/Tags
- Save posts to `src/content/posts/`

### 3. Review Migrated Posts

After migration, review the generated markdown files in `src/content/posts/`:

- Check that code blocks have the correct language highlighting
- Verify images are properly linked (you may need to download and re-reference images)
- Review frontmatter for accuracy
- Fix any formatting issues

### 4. Build and Preview

```bash
pnpm dev
```

Visit http://localhost:4321 to preview the migrated content.

## Customizing Migration

### Adding More Categories

Edit `scripts/migrate-blog.mjs` to customize how categories and tags are extracted.

### Handling Images

By default, images remain as external links. To host images locally:

1. Create a directory for post assets: `src/content/posts/<post-name>/`
2. Move the markdown to `src/content/posts/<post-name>/index.md`
3. Download images to the same directory
4. Update image references to use relative paths: `./image.png`

### Adjusting Code Block Detection

The migration script includes heuristics for detecting programming languages. Edit the `detectLanguage` and `detectLanguageFromContent` functions in `scripts/migrate-blog.mjs` to improve detection for your specific content.

## Troubleshooting

### Migration Script Can't Access Blog

If you receive network errors, the blog might be temporarily unavailable. Try again later or check your internet connection.

### Posts Not Appearing

Ensure posts don't have `draft: true` in their frontmatter unless you want them hidden.

### Build Errors

Run `pnpm check` to identify any issues with the markdown content or frontmatter.

## Manual Post Creation

To create new posts manually:

```bash
pnpm new-post my-new-post
```

This creates a new markdown file with the required frontmatter template.
