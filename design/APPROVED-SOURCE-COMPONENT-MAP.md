# HUMMIN approved-source component inventory

This inventory is derived from the owner's archived design documents, **not** the abandoned React reconstruction.

| Original source | HTML elements | Verbatim structural fragments | Original CSS style blocks |
| --- | ---: | ---: | ---: |
| `design/sources/site-v4.template.json` | 386 | 74 | 2 |
| `design/sources/assessment.*.part` | 220 | 49 | 2 |
| `design/sources/insights-v4.html.gz.b64` | 271 | 63 | 1 |
| **Total** | **877** | **186** | **5** |

The source design contains custom `sc-if`, `sc-for`, `dc-import`, and other design-runtime nodes. Some layouts are composed dynamically. There is no justified direct one-to-one mapping between a static fragment and a rendered screen without evaluating the original runtime.

The approved site layout also uses substantial **inline style attributes**. Recreating these rules by guessing stylesheet values was not a faithful extraction strategy.

## Exact, reproducible extraction

1. From the repository root, install the parser temporarily: `npm install --no-save parse5@7.3.0`.
2. Run `node scripts/catalog-approved-source.mjs`.
3. Examine `artifacts/source-component-catalog/{site,assessment,insights}/`:
   - `original.html` preserves each decoded original source document.
   - `inventory.json` indexes every parsed source element with all attributes, parent, line and offset.
   - `fragments/` contains exact source substrings for layout and runtime components.
   - `css/` contains exact style block contents.
4. The `hummin-source-catalog.yml` workflow can also produce an artifact without deploying anything.

Original source archives and versioned brand assets remain intact. No reconstructed React presentation code should be used as a visual reference. The source archive is now **required for source inspection**, and must not be deleted.
