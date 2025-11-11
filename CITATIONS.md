# Citation Guide for The Recursory

## How to Add Citations

### For Human Editors

1. **Add Citation Button**: Click the citation button (📝) in the toolbar while editing
2. This will insert `[1]` at your cursor position
3. A References section will be added at the bottom with a template:
   ```
   ## References
   [1]: https://example.com "Source Title"
   ```
4. Replace the URL and title with your actual source

### For AI Assistants

When writing articles, use this citation format:

**In the text:**
```markdown
This is a fact that needs a citation [1]. Another fact [2].
```

**At the bottom of the article:**
```markdown
## References
[1]: https://example.com/article "Title of the Article"
[2]: https://another-source.com "Another Source Title"
```

### Citation Format

- **Inline**: Use `[number]` where the citation is needed
- **References**: Use `[number]: URL "Title"` format
- The URL is the link to the source
- The title (in quotes) is what will be displayed in the bibliography

### Example Article with Citations

```markdown
# My Article

The Recursory is a wiki-style knowledge base [1]. It supports markdown formatting [2].

You can link to other articles using [[Article Name]] syntax.

## References
[1]: https://github.com/example/recursory "The Recursory GitHub"
[2]: https://www.markdownguide.org "Markdown Guide"
```

### How Citations Work

- Citations appear as superscript numbers: [1]
- Clicking a citation jumps to the reference in the bibliography
- The bibliography shows the full source with a clickable link
- A ↑ arrow in the bibliography jumps back to where the citation was used
