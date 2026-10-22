## Maximalist Assemblage


### [Dissertation Proposal](../DissertationProposal/)

### [The Artifact/Assemblage](./ArtifactAssemblage/)

### Maximalist Methods for a Maximalist Assemblage (MMfaMA)

Oldest to most recent. I find it helpful to see the progression through drafts
rather than overwrite them.

{% assign drafts = site.pages | where_exp: "p", "p.path contains 'MaximalistAssemblage/drafts/'" | sort: "path" %}
{% for d in drafts %}
- [{{ d.title | default: d.name }}]({{ d.url | relative_url }})
{% endfor %}

#### [MMfaMA, latest]({{ '/MaximalistAssemblage/Maximalist_Methodology.html' | relative_url }})

