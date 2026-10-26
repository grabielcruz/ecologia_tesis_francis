from __future__ import annotations

import html
import re
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "greenmetric-erd.mmd"
OUTPUT = ROOT / "greenmetric-erd-multipage"
WIDTH = 1600
HEIGHT = 1131
INK = "#173f3a"
GREEN = "#168477"
LINE = "#52877e"
PALE = "#f4faf8"
MUTED = "#5f7773"


@dataclass(frozen=True)
class Field:
    kind: str
    name: str
    key: str
    note: str


@dataclass(frozen=True)
class Entity:
    name: str
    fields: tuple[Field, ...]


@dataclass(frozen=True)
class Edge:
    source: str
    target: str
    label: str
    source_cardinality: str
    target_cardinality: str
    route: tuple[tuple[int, int], ...] = ()


@dataclass(frozen=True)
class Sheet:
    slug: str
    title: str
    summary: str
    entities: tuple[str, ...]
    references: tuple[tuple[str, str], ...]
    positions: tuple[tuple[str, int, int, int], ...]
    edges: tuple[Edge, ...]


def parse_schema(source: str) -> tuple[dict[str, Entity], list[Edge]]:
    entities: dict[str, Entity] = {}
    edges: list[Edge] = []
    lines = iter(source.splitlines())
    for line in lines:
        match = re.fullmatch(r"\s*(\w+)\s*\{", line)
        if match:
            name = match.group(1)
            fields: list[Field] = []
            for field_line in lines:
                if field_line.strip() == "}":
                    break
                field_match = re.fullmatch(
                    r'\s+(\w+)\s+(\w+)(?:\s+(PK|FK))?(?:\s+"([^"]+)")?\s*',
                    field_line,
                )
                if field_match:
                    kind, field_name, key, note = field_match.groups()
                    fields.append(Field(kind, field_name, key or "", note or ""))
            entities[name] = Entity(name, tuple(fields))
            continue
        edge_match = re.fullmatch(
            r"\s*(\w+)\s+(\S+)\s+(\w+)\s*:\s*(.+?)\s*", line
        )
        if edge_match:
            source_name, cardinality, target_name, label = edge_match.groups()
            left, right = cardinality.split("--", maxsplit=1)
            source_count = "1" if left == "||" else "0..1"
            target_count = "0..N" if right in ("o{", "o|") else "1"
            edges.append(
                Edge(
                    source_name,
                    target_name,
                    label,
                    source_count,
                    target_count,
                )
            )
    if len(entities) != 17 or not edges:
        raise ValueError(
            f"Unexpected source schema: {len(entities)} entities, {len(edges)} relationships"
        )
    return entities, edges


def make_sheets() -> tuple[Sheet, ...]:
    return (
        Sheet(
            "01-access",
            "Identidad, acceso y perfil de usuario",
            "Roles asignados, cuentas y puntuaciones personales.",
            ("Role", "User", "FindFlowerScore"),
            (),
            (
                ("Role", 70, 345, 400),
                ("User", 575, 260, 455),
                ("FindFlowerScore", 1150, 365, 400),
            ),
            (
                Edge("Role", "User", "asigna", "1", "0..N"),
                Edge("User", "FindFlowerScore", "tiene puntuación", "1", "1"),
            ),
        ),
        Sheet(
            "02-green-spaces",
            "Áreas verdes y biodiversidad",
            "Espacios, reseñas, catálogo de especies e inventario de árboles.",
            ("GreenSpace", "GreenSpaceReview", "TreeType", "TreeInventory"),
            (("User", "lámina 2"),),
            (
                ("User", 65, 235, 390),
                ("TreeType", 1080, 220, 445),
                ("GreenSpace", 65, 405, 450),
                ("TreeInventory", 1080, 475, 455),
                ("GreenSpaceReview", 590, 770, 450),
            ),
            (
                Edge(
                    "GreenSpace",
                    "TreeInventory",
                    "contiene",
                    "1",
                    "0..N",
                    ((515, 565), (790, 565), (1080, 610)),
                ),
                Edge(
                    "TreeType",
                    "TreeInventory",
                    "clasifica",
                    "1",
                    "0..N",
                    ((1302, 430), (1302, 475)),
                ),
                Edge(
                    "User",
                    "TreeInventory",
                    "registra",
                    "1",
                    "0..N",
                    ((455, 280), (790, 350), (1080, 545)),
                ),
                Edge(
                    "User",
                    "TreeInventory",
                    "valida",
                    "1",
                    "0..N",
                    ((455, 325), (820, 390), (1080, 585)),
                ),
                Edge(
                    "GreenSpace",
                    "GreenSpaceReview",
                    "recibe",
                    "1",
                    "0..N",
                    ((515, 695), (560, 775), (590, 840)),
                ),
                Edge(
                    "User",
                    "GreenSpaceReview",
                    "escribe",
                    "1",
                    "0..N",
                    ((455, 330), (520, 340), (720, 600), (720, 680), (590, 805)),
                ),
            ),
        ),
        Sheet(
            "03-reports",
            "Reportes de áreas verdes",
            "Cada reporte vincula a una persona y al espacio relacionado.",
            ("ReportOfGreenArea",),
            (("User", "lámina 2"), ("GreenSpace", "lámina 3")),
            (
                ("User", 75, 230, 405),
                ("GreenSpace", 75, 690, 405),
                ("ReportOfGreenArea", 825, 385, 620),
            ),
            (
                Edge(
                    "User",
                    "ReportOfGreenArea",
                    "crea",
                    "1",
                    "0..N",
                    ((480, 295), (650, 350), (825, 465)),
                ),
                Edge(
                    "GreenSpace",
                    "ReportOfGreenArea",
                    "tiene reportes",
                    "1",
                    "0..N",
                    ((480, 795), (650, 685), (825, 625)),
                ),
            ),
        ),
        Sheet(
            "04-proposals-votes",
            "Propuestas y votaciones",
            "Las propuestas se vinculan a un área y registran quién propone y quién vota.",
            ("ProposalOfGreenArea", "VoteOfProposal"),
            (("User", "lámina 2"), ("GreenSpace", "lámina 3")),
            (
                ("GreenSpace", 65, 300, 405),
                ("User", 65, 805, 405),
                ("ProposalOfGreenArea", 600, 300, 520),
                ("VoteOfProposal", 1180, 430, 370),
            ),
            (
                Edge(
                    "GreenSpace",
                    "ProposalOfGreenArea",
                    "recibe propuestas",
                    "1",
                    "0..N",
                    ((470, 360), (490, 250), (560, 250), (600, 420)),
                ),
                Edge(
                    "User",
                    "ProposalOfGreenArea",
                    "propone",
                    "1",
                    "0..N",
                    ((470, 865), (480, 970), (570, 970), (600, 735)),
                ),
                Edge(
                    "ProposalOfGreenArea",
                    "VoteOfProposal",
                    "recibe votos",
                    "1",
                    "0..N",
                    ((1120, 555), (1150, 555), (1180, 555)),
                ),
                Edge(
                    "User",
                    "VoteOfProposal",
                    "vota",
                    "1",
                    "0..N",
                    ((470, 865), (520, 1030), (1140, 1030), (1180, 620)),
                ),
            ),
        ),
        Sheet(
            "05-project-updates",
            "Proyectos y seguimiento",
            "Las propuestas aprobadas pueden generar proyectos con avances registrados.",
            ("ProjectOfProposal", "ProjectUpdateOfProposal"),
            (
                ("ProposalOfGreenArea", "lámina 5"),
                ("GreenSpace", "lámina 3"),
                ("User", "lámina 2"),
            ),
            (
                ("ProposalOfGreenArea", 65, 235, 450),
                ("GreenSpace", 65, 500, 450),
                ("User", 65, 800, 450),
                ("ProjectOfProposal", 800, 260, 620),
                ("ProjectUpdateOfProposal", 800, 665, 620),
            ),
            (
                Edge(
                    "ProposalOfGreenArea",
                    "ProjectOfProposal",
                    "genera",
                    "1",
                    "0..N",
                    ((515, 305), (640, 350), (800, 410)),
                ),
                Edge(
                    "GreenSpace",
                    "ProjectOfProposal",
                    "se ejecuta en",
                    "1",
                    "0..N",
                    ((515, 565), (660, 545), (800, 500)),
                ),
                Edge(
                    "ProjectOfProposal",
                    "ProjectUpdateOfProposal",
                    "registra avances",
                    "1",
                    "0..N",
                    ((1110, 555), (1110, 665)),
                ),
                Edge(
                    "User",
                    "ProjectUpdateOfProposal",
                    "registra",
                    "1",
                    "0..N",
                    ((515, 865), (660, 865), (800, 825)),
                ),
            ),
        ),
        Sheet(
            "06-surveys",
            "Encuestas y respuestas",
            "Una respuesta relaciona a una persona con una encuesta; la pareja es única.",
            ("Survey", "SurveyResponse"),
            (("User", "lámina 2"),),
            (
                ("Survey", 95, 230, 510),
                ("User", 95, 750, 405),
                ("SurveyResponse", 885, 455, 560),
            ),
            (
                Edge(
                    "Survey",
                    "SurveyResponse",
                    "recibe respuestas",
                    "1",
                    "0..N",
                    ((605, 380), (735, 410), (885, 540)),
                ),
                Edge(
                    "User",
                    "SurveyResponse",
                    "responde",
                    "1",
                    "0..N",
                    ((500, 830), (700, 790), (885, 705)),
                ),
            ),
        ),
        Sheet(
            "07-events",
            "Eventos e inscripciones",
            "Las inscripciones conectan los eventos con las personas participantes.",
            ("Event", "EventEnrollment"),
            (("User", "lámina 2"),),
            (
                ("User", 70, 235, 405),
                ("Event", 730, 230, 555),
                ("EventEnrollment", 610, 695, 560),
            ),
            (
                Edge(
                    "User",
                    "Event",
                    "crea",
                    "1",
                    "0..N",
                    ((475, 330), (600, 315), (730, 360)),
                ),
                Edge(
                    "Event",
                    "EventEnrollment",
                    "tiene participantes",
                    "1",
                    "0..N",
                    ((1005, 580), (900, 625), (890, 695)),
                ),
                Edge(
                    "User",
                    "EventEnrollment",
                    "se inscribe",
                    "1",
                    "0..N",
                    ((475, 365), (540, 540), (610, 800)),
                ),
            ),
        ),
        Sheet(
            "08-greenmetric",
            "Registros GreenMetric",
            "Cada cálculo conserva los datos de entrada y los seis indicadores derivados.",
            ("GreenMetricRecord",),
            (("User", "lámina 2"),),
            (
                ("User", 80, 440, 435),
                ("GreenMetricRecord", 700, 235, 820),
            ),
            (
                Edge(
                    "User",
                    "GreenMetricRecord",
                    "registra cálculos",
                    "1",
                    "0..N",
                    ((515, 550), (610, 550), (700, 550)),
                ),
            ),
        ),
    )


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def dimensions(entity: Entity, width: int, reference: bool = False) -> int:
    if reference:
        return 128
    return 62 + max(1, len(entity.fields)) * 27 + (24 if width < 410 else 18)


def text(x: int, y: int, value: str, size: int, color: str, weight: int = 400) -> str:
    return (
        f'<text x="{x}" y="{y}" font-family="Arial, sans-serif" '
        f'font-size="{size}" font-weight="{weight}" fill="{color}">{esc(value)}</text>'
    )


def draw_card(
    name: str,
    x: int,
    y: int,
    width: int,
    entities: dict[str, Entity],
    reference: str | None = None,
) -> tuple[str, int]:
    entity = entities[name]
    height = dimensions(entity, width, reference is not None)
    label = f"{name}  ·  referencia a {reference}" if reference else name
    parts = [
        f'<g class="entity"><rect x="{x}" y="{y}" width="{width}" height="{height}" rx="14" fill="#ffffff" stroke="{GREEN}" stroke-width="2"/>',
        f'<path d="M{x+14},{y} h{width-28} a14,14 0 0 1 14,14 v39 h-{width} v-39 a14,14 0 0 1 14,-14" fill="{INK}"/>',
        text(x + 18, y + 34, label, 21 if len(label) < 33 else 17, "#ffffff", 700),
    ]
    fields = entity.fields[:1] if reference else entity.fields
    if reference:
        parts.append(
            text(x + 18, y + 78, f"{fields[0].kind}  {fields[0].name}  ·  PK", 16, MUTED, 600)
        )
        parts.append(text(x + 18, y + 106, f"Tabla completa: {reference}.", 14, MUTED))
    else:
        for index, field in enumerate(fields):
            row_y = y + 82 + index * 27
            if index % 2 == 0:
                parts.append(
                    f'<rect x="{x+1}" y="{row_y-19}" width="{width-2}" height="26" fill="{PALE}"/>'
                )
            parts.append(
                f'<text x="{x+17}" y="{row_y}" font-family="Consolas, monospace" '
                f'font-size="15" fill="{INK}">{esc(field.kind)}  {esc(field.name)}</text>'
            )
            tags: list[str] = []
            if field.key:
                tags.append(field.key)
            if "unique" in field.note.lower():
                tags.append("UQ")
            if "nullable" in field.note.lower():
                tags.append("NULL")
            if tags:
                tag_text = " · ".join(tags)
                tag_width = max(35, len(tag_text) * 8)
                tag_color = GREEN if "FK" in tags else "#526d68"
                parts.append(
                    f'<rect x="{x+width-tag_width-12}" y="{row_y-17}" width="{tag_width}" '
                    f'height="21" rx="7" fill="#e2f2ee"/>'
                )
                parts.append(
                    f'<text x="{x+width-tag_width-7}" y="{row_y-2}" font-family="Arial, sans-serif" '
                    f'font-size="12" font-weight="700" fill="{tag_color}">{esc(tag_text)}</text>'
                )
            if field.note and not any(
                word in field.note.lower() for word in ("unique", "nullable")
            ):
                note = field.note
                if len(note) > 42:
                    note = note[:39] + "..."
                parts.append(
                    f'<text x="{x+width-14}" y="{row_y-2}" text-anchor="end" '
                    f'font-family="Arial, sans-serif" font-size="11" fill="{MUTED}">{esc(note)}</text>'
                )
            parts.append(
                f'<line x1="{x+1}" y1="{row_y+8}" x2="{x+width-1}" y2="{row_y+8}" stroke="#e3eeeb"/>'
            )
    parts.append("</g>")
    return "".join(parts), height


def draw_edge(edge: Edge, positions: dict[str, tuple[int, int, int, int]]) -> str:
    if edge.route:
        points = edge.route
    else:
        sx, sy, sw, sh = positions[edge.source]
        tx, ty, tw, th = positions[edge.target]
        start_center = (sx + sw / 2, sy + sh / 2)
        end_center = (tx + tw / 2, ty + th / 2)
        dx = end_center[0] - start_center[0]
        dy = end_center[1] - start_center[1]
        start_scale = min(
            (sw / 2) / max(abs(dx), 0.01),
            (sh / 2) / max(abs(dy), 0.01),
        )
        end_scale = min(
            (tw / 2) / max(abs(dx), 0.01),
            (th / 2) / max(abs(dy), 0.01),
        )
        points = (
            (round(start_center[0] + dx * start_scale), round(start_center[1] + dy * start_scale)),
            (round(end_center[0] - dx * end_scale), round(end_center[1] - dy * end_scale)),
        )
    path_data = " ".join(
        ("M" if index == 0 else "L") + f" {x} {y}"
        for index, (x, y) in enumerate(points)
    )
    lengths = [
        ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5
        for (x1, y1), (x2, y2) in zip(points, points[1:])
    ]
    total = sum(lengths)
    remaining = total / 2
    label_x, label_y = points[0]
    for (x1, y1), (x2, y2), length in zip(points, points[1:], lengths):
        if remaining <= length:
            fraction = remaining / max(length, 0.01)
            label_x = round(x1 + (x2 - x1) * fraction)
            label_y = round(y1 + (y2 - y1) * fraction)
            break
        remaining -= length
    relation = f"{edge.label}  {edge.source_cardinality}:{edge.target_cardinality}"
    pill_width = max(110, len(relation) * 8 + 20)
    label_y = min(max(label_y - 13, 235), HEIGHT - 50)
    return (
        f'<path d="{path_data}" fill="none" stroke="{LINE}" stroke-width="3" '
        f'stroke-linecap="round" stroke-linejoin="round" marker-end="url(#arrow)"/>'
        f'<rect x="{label_x-pill_width/2:.0f}" y="{label_y-15}" width="{pill_width}" height="29" '
        f'rx="10" fill="#ffffff" stroke="#c8ded8"/>'
        f'<text x="{label_x}" y="{label_y+5}" text-anchor="middle" '
        f'font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="{INK}">'
        f"{esc(relation)}</text>"
    )


def make_svg(
    sheet: Sheet, page_number: int, entities: dict[str, Entity]
) -> str:
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}">',
        '<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#52877e"/></marker></defs>',
        f'<rect width="{WIDTH}" height="{HEIGHT}" fill="#f4faf8"/>',
        f'<rect x="0" y="0" width="{WIDTH}" height="14" fill="{GREEN}"/>',
        text(60, 72, "UNIVERDE  /  MODELO DE DATOS", 17, GREEN, 700),
        text(60, 126, sheet.title, 36, INK, 700),
        text(60, 169, sheet.summary, 20, MUTED),
        f'<rect x="1435" y="48" width="105" height="48" rx="18" fill="{INK}"/>',
        text(1457, 79, f"LÁMINA {page_number}", 15, "#ffffff", 700),
        '<line x1="60" y1="195" x2="1540" y2="195" stroke="#d2e3df" stroke-width="2"/>',
    ]
    positions: dict[str, tuple[int, int, int, int]] = {}
    for name, x, y, width in sheet.positions:
        reference_page = next(
            (page for reference_name, page in sheet.references if reference_name == name),
            None,
        )
        height = dimensions(entities[name], width, reference_page is not None)
        positions[name] = (x, y, width, height)
    for edge in sheet.edges:
        parts.append(draw_edge(edge, positions))
    for name, x, y, width in sheet.positions:
        reference = next(
            (page for reference_name, page in sheet.references if reference_name == name),
            None,
        )
        card, _ = draw_card(name, x, y, width, entities, reference)
        parts.append(card)
    parts.append(
        f'<line x1="60" y1="1080" x2="1540" y2="1080" stroke="#d2e3df"/>'
    )
    parts.append(
        text(
            60,
            1107,
            "PK clave primaria   ·   FK clave foránea   ·   UQ único   ·   NULL admite nulo",
            14,
            MUTED,
        )
    )
    parts.append(text(1320, 1107, "Fuente: server/models.ts", 14, MUTED))
    parts.append("</svg>")
    return "".join(parts)


def make_overview(sheets: tuple[Sheet, ...]) -> str:
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}">',
        f'<rect width="{WIDTH}" height="{HEIGHT}" fill="{PALE}"/>',
        f'<rect width="{WIDTH}" height="14" fill="{GREEN}"/>',
        text(70, 85, "UNIVERDE  /  MODELO DE DATOS", 18, GREEN, 700),
        text(70, 153, "Diagrama entidad–relación", 44, INK, 700),
        text(70, 203, "Edición multipágina · 17 entidades organizadas por área funcional", 22, MUTED),
        '<line x1="70" y1="235" x2="1530" y2="235" stroke="#d2e3df" stroke-width="2"/>',
    ]
    descriptions = [
        "Roles, cuentas y puntuaciones del juego Busca Flores.",
        "Espacios, reseñas, especies e inventario arbóreo.",
        "Reportes vinculados a sus autores y áreas verdes.",
        "Relaciones entre propuestas, áreas y votos.",
        "Proyectos vinculados a propuestas y registro de avances.",
        "Encuestas y respuestas únicas por participante.",
        "Eventos y relaciones de inscripción.",
        "Datos de entrada y seis indicadores por cálculo.",
    ]
    card_w = 700
    card_h = 155
    x_positions = (70, 830)
    y_positions = (285, 475, 665, 855)
    for index, (sheet, description) in enumerate(zip(sheets, descriptions), start=2):
        column = 0 if index < 6 else 1
        row = (index - 2) if index < 6 else (index - 6)
        x = x_positions[column]
        y = y_positions[row]
        parts.extend(
            [
                f'<rect x="{x}" y="{y}" width="{card_w}" height="{card_h}" rx="18" fill="#ffffff" stroke="#c5ddd7" stroke-width="2"/>',
                f'<circle cx="{x+52}" cy="{y+51}" r="28" fill="{GREEN}"/>',
                text(x + 39, y + 58, f"{index:02}", 17, "#ffffff", 700),
                text(x + 100, y + 47, sheet.title, 22, INK, 700),
                text(x + 100, y + 81, description, 15, MUTED),
                text(x + 100, y + 119, f"Lámina {index}  ·  {len(sheet.entities)} tabla(s) detallada(s)", 14, GREEN, 700),
            ]
        )
    parts.extend(
        [
            '<line x1="70" y1="1062" x2="1530" y2="1062" stroke="#d2e3df" stroke-width="2"/>',
            text(70, 1096, "Leyenda: PK clave primaria · FK clave foránea · UQ único · NULL admite nulo", 16, MUTED),
            text(1310, 1096, "Relaciones: 1 : 0..N", 16, GREEN, 700),
            "</svg>",
        ]
    )
    return "".join(parts)


def make_mermaid(
    sheet: Sheet, entities: dict[str, Entity]
) -> str:
    names = list(sheet.entities) + [name for name, _ in sheet.references]
    lines = ["erDiagram"]
    for name in names:
        lines.append(f"    {name} {{")
        if name in sheet.entities:
            for field in entities[name].fields:
                suffix = f' "{field.note}"' if field.note else ""
                marker = f" {field.key}" if field.key else ""
                lines.append(
                    f"        {field.kind} {field.name}{marker}{suffix}"
                )
        else:
            primary_key = next(
                field for field in entities[name].fields if field.key == "PK"
            )
            lines.append(
                f"        {primary_key.kind} {primary_key.name} PK"
            )
            lines.append("        string referencia")
        lines.append("    }")
    for edge in sheet.edges:
        left = "||" if edge.source_cardinality == "1" else "o|"
        right = "o{" if edge.target_cardinality == "0..N" else "||"
        lines.append(
            f"    {edge.source} {left}--{right} {edge.target} : {edge.label.replace(' ', '_')}"
        )
    return "\n".join(lines) + "\n"


def main() -> None:
    entities, _ = parse_schema(SOURCE.read_text(encoding="utf-8"))
    sheets = make_sheets()
    detailed_entities = [
        name for sheet in sheets for name in sheet.entities
    ]
    if len(detailed_entities) != len(set(detailed_entities)) or set(
        detailed_entities
    ) != set(entities):
        raise ValueError("Detailed sheets must cover every source entity exactly once")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    (OUTPUT / "00-index.svg").write_text(make_overview(sheets), encoding="utf-8")
    for page_number, sheet in enumerate(sheets, start=2):
        for reference_name, _ in sheet.references:
            if reference_name not in entities:
                raise ValueError(f"Missing referenced entity: {reference_name}")
        (OUTPUT / f"{sheet.slug}.svg").write_text(
            make_svg(sheet, page_number, entities), encoding="utf-8"
        )
        (OUTPUT / f"{sheet.slug}.mmd").write_text(
            make_mermaid(sheet, entities), encoding="utf-8"
        )
    print(
        f"Generated {len(sheets) + 1} SVG sheets and {len(sheets)} editable Mermaid ERDs in {OUTPUT}"
    )


if __name__ == "__main__":
    main()
