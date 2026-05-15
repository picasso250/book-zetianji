"""Build Jekyll site to static HTML for Cloudflare Workers Assets deployment."""
import os
import re
import shutil
import frontmatter
import markdown
import yaml

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE_DIR = os.path.join(ROOT, '_site')

# Load site config
with open(os.path.join(ROOT, '_config.yml'), 'r', encoding='utf-8') as f:
    site_config = yaml.safe_load(f)

site = {
    'title': site_config.get('title', ''),
    'description': site_config.get('description', ''),
    'lang': 'en-US',
    'github': {
        'is_project_page': True,
        'repository_url': 'https://github.com/picasso250/book-zetianji',
        'repository_name': 'book-zetianji',
        'owner_name': 'picasso250',
        'owner_url': 'https://github.com/picasso250',
        'build_revision': 'cf-workers',
    },
    'google_analytics': None,
    'show_downloads': False,
}

md = markdown.Markdown(extensions=['extra', 'codehilite'])


def load_layout(name):
    """Load layout template content."""
    path = os.path.join(ROOT, '_layouts', name)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    # Fallback: content only
    return '{{ content }}'


def render_liquid(template, page, content_html):
    """Render a Liquid-style template with given variables."""
    html = template

    # {% seo %} → basic SEO tags
    title = page.get('title', site['title'])
    html = html.replace('{% seo %}',
        f'<title>{title} - {site["title"]}</title>\n'
        f'<meta name="description" content="{site["description"]}">')

    # {{ content }}
    html = html.replace('{{ content }}', content_html)

    # {{ page.title }}
    html = html.replace('{{ page.title }}', page.get('title', ''))

    # {{ site.title }} / {{ site.title | default: ... }}
    html = re.sub(r'\{\{\s*site\.title\s*(\|\s*default:\s*"[^"]*")?\s*\}\}',
                  site['title'], html)

    # {{ site.description }} / {{ site.description | default: ... }}
    html = re.sub(r'\{\{\s*site\.description\s*(\|\s*default:\s*"[^"]*")?\s*\}\}',
                  site['description'], html)

    # {{ site.lang | default: "en-US" }}
    html = re.sub(r'\{\{\s*site\.lang\s*\|\s*default:\s*"[^"]*"\s*\}\}',
                  site['lang'], html)

    # {{ site.github.X }}
    html = html.replace('{{ site.github.repository_url }}', site['github']['repository_url'])
    html = html.replace('{{ site.github.repository_name }}', site['github']['repository_name'])
    html = html.replace('{{ site.github.owner_name }}', site['github']['owner_name'])
    html = html.replace('{{ site.github.owner_url }}', site['github']['owner_url'])
    html = html.replace('{{ site.github.build_revision }}', site['github']['build_revision'])

    # {{ site.github.is_project_page }} → true
    html = html.replace('{{ site.github.is_project_page }}', 'true')

    # relative_url filter: '...' | relative_url → just the path
    html = re.sub(
        r"\{\{\s*'([^']+)'\s*\|\s*relative_url\s*\}\}",
        r'\1', html)
    # relative_url with append
    html = re.sub(
        r"\{\{\s*'([^']+)'\s*\|\s*append:\s*([^|]+?)\s*\|\s*relative_url\s*\}\}",
        lambda m: m.group(1) + m.group(2).strip(), html)

    # {% if site.github.is_project_page %} ... {% endif %}
    # In our case it's always true, so keep content, remove tags
    html = re.sub(r'\{%\s*if\s+site\.github\.is_project_page\s*%\}', '', html)
    html = re.sub(r'\{%\s*endif\s*%\}', '', html)

    # {% if site.show_downloads %} ... {% endif %} → remove (false)
    html = re.sub(r'\{%\s*if\s+site\.show_downloads\s*%\}.*?\{%\s*endif\s*%\}',
                  '', html, flags=re.DOTALL)

    # {% if site.google_analytics %} ... {% endif %} → remove (false)
    html = re.sub(r'\{%\s*if\s+site\.google_analytics\s*%\}.*?\{%\s*endif\s*%\}',
                  '', html, flags=re.DOTALL)

    return html


def build_md_file(filepath):
    """Build a single markdown file to _site."""
    relpath = os.path.relpath(filepath, ROOT)

    # Read and parse frontmatter
    post = frontmatter.load(filepath)
    page = dict(post.metadata)

    # Convert markdown to HTML
    content_html = md.convert(post.content)

    # Determine layout
    layout_name = page.get('layout', 'default') + '.html'
    layout = load_layout(layout_name)

    # Render
    output = render_liquid(layout, page, content_html)

    # Write output as .html file
    out_html = os.path.join(SITE_DIR, os.path.splitext(relpath)[0] + '.html')
    os.makedirs(os.path.dirname(out_html), exist_ok=True)
    with open(out_html, 'w', encoding='utf-8') as f:
        f.write(output)

    # Also create clean URL version (without .html extension) for CF compatibility
    out_clean = os.path.join(SITE_DIR, os.path.splitext(relpath)[0])
    with open(out_clean, 'w', encoding='utf-8') as f:
        f.write(output)

    print(f'  [OK] {relpath} -> {os.path.relpath(out_html, SITE_DIR)}')


def main():
    # Clean _site
    if os.path.exists(SITE_DIR):
        shutil.rmtree(SITE_DIR)
    os.makedirs(SITE_DIR)

    print('Building book-zetianji...\n')

    # Build all markdown files (except _layouts)
    for root, dirs, files in os.walk(ROOT):
        # Skip _site, _layouts, .script, .git
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('_site', '_layouts', 'node_modules')]

        for f in files:
            if f.endswith('.md'):
                build_md_file(os.path.join(root, f))

    # Copy static assets
    assets_src = os.path.join(ROOT, 'assets')
    assets_dst = os.path.join(SITE_DIR, 'assets')
    if os.path.exists(assets_src):
        shutil.copytree(assets_src, assets_dst)
        print('\n  [OK] assets/ copied')

    # Copy roles.json
    roles_src = os.path.join(ROOT, 'roles.json')
    roles_dst = os.path.join(SITE_DIR, 'roles.json')
    if os.path.exists(roles_src):
        shutil.copy2(roles_src, roles_dst)
        print('  [OK] roles.json copied')

    # Copy .nojekyll to prevent GitHub Pages from processing
    with open(os.path.join(SITE_DIR, '.nojekyll'), 'w') as f:
        pass

    # Generate 404.html
    layout = load_layout('default.html')
    notfound = render_liquid(layout, {'title': '404'}, '<h2>Page not found</h2><p><a href="/">返回目录</a></p>')
    with open(os.path.join(SITE_DIR, '404.html'), 'w', encoding='utf-8') as f:
        f.write(notfound)
    print('  [OK] 404.html created')

    print(f'\nDone! Output in {SITE_DIR}')


if __name__ == '__main__':
    main()
