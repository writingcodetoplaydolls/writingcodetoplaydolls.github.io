---
title: Dissertation
glossary: false
collapsible: false
---

Pages in progress. Each starts as a line of thought and grows toward a section or chapter.

<ul class="dissertation-pages">
{%- assign dpages = site.pages | sort: "path" -%}
{%- for p in dpages -%}
{%- if p.dir == "/Dissertation/" and p.name != "index.md" %}
  <li><a href="{{ p.url | relative_url }}">{{ p.title | default: p.name }}</a>{% if p.status %} <span style="color: var(--text-muted);">· {{ p.status }}{% if p.started %} · started {{ p.started }}{% endif %}</span>{% endif %}</li>
{%- endif -%}
{%- endfor %}
</ul>
