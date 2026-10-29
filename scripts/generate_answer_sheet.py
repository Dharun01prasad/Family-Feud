"""Generate the host answer sheet from the current SQLite match assignments."""

from collections import defaultdict
from pathlib import Path
import sqlite3
import textwrap

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import FancyBboxPatch, Rectangle
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
DATABASE = ROOT / "backend" / "prisma" / "dev.db"
OUTPUT = ROOT / "output" / "pdf" / "Feud_Night_Match_Answer_Sheet.pdf"
PREVIEW = ROOT / "tmp" / "pdfs"
NAVY = "#082c5e"
BLUE = "#126bbf"
PALE = "#f4f9ff"
GOLD = "#f4b529"


def draw_text(fig, x, y, text, *, size=10, color=NAVY, weight="normal", ha="left"):
    fig.text(x, y, text, fontsize=size, color=color, fontweight=weight, ha=ha,
             va="center", family="DejaVu Sans")


def draw_card(fig, top, order, question):
    bottom = top - 0.235
    fig.patches.append(FancyBboxPatch((0.065, bottom), 0.87, 0.235,
                                      boxstyle="round,pad=0.003,rounding_size=0.009",
                                      edgecolor="#c7ddef", facecolor="white", linewidth=1,
                                      transform=fig.transFigure))
    fig.patches.append(Rectangle((0.065, top - 0.034), 0.87, 0.034,
                                 transform=fig.transFigure, facecolor=BLUE, edgecolor="none"))
    label = f"ROUND {order}"
    draw_text(fig, 0.086, top - 0.017, label, size=8.8, color="white", weight="bold")
    draw_text(fig, 0.916, top - 0.017, question["category"], size=7.7,
              color="#d9efff", ha="right")
    lines = textwrap.wrap(question["text"], width=82, break_long_words=False)
    if len(lines) > 2:
        raise ValueError(f"Question too long for answer sheet: {question['text']}")
    for index, line in enumerate(lines):
        draw_text(fig, 0.087, top - 0.057 - index * 0.016, line, size=10.1, weight="bold")
    row_top = top - 0.103
    draw_text(fig, 0.09, row_top, "RANK", size=7.5, color="#6c83a0", weight="bold")
    draw_text(fig, 0.16, row_top, "ANSWER", size=7.5, color="#6c83a0", weight="bold")
    draw_text(fig, 0.91, row_top, "POINTS", size=7.5, color="#6c83a0", weight="bold", ha="right")
    fig.patches.append(Rectangle((0.087, row_top - 0.011), 0.825, 0.001,
                                 transform=fig.transFigure, facecolor="#c9dced", edgecolor="none"))
    for index, answer in enumerate(question["answers"]):
        y = row_top - 0.024 - index * 0.021
        draw_text(fig, 0.095, y, str(answer["rank"]), size=9.5, color=BLUE, weight="bold")
        draw_text(fig, 0.16, y, answer["text"], size=9.1)
        draw_text(fig, 0.906, y, str(answer["points"]), size=9.6,
                  color=BLUE, weight="bold", ha="right")
        if index < len(question["answers"]) - 1:
            fig.patches.append(Rectangle((0.087, y - 0.0105), 0.825, 0.00065,
                                         transform=fig.transFigure, facecolor="#e9f0f7", edgecolor="none"))


def load_matches():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    rows = connection.execute('''
        SELECT m.number AS match_number, m.bracketPosition AS stage,
               ta.name AS team_a, tb.name AS team_b, mq."order" AS round_order,
               q.id AS question_id, q.text AS question_text, q.category,
               a.rank, a.text AS answer_text, a.points
        FROM Match m
        LEFT JOIN Team ta ON ta.id = m.teamAId
        LEFT JOIN Team tb ON tb.id = m.teamBId
        JOIN MatchQuestion mq ON mq.matchId = m.id
        JOIN Question q ON q.id = mq.questionId
        JOIN Answer a ON a.questionId = q.id
        ORDER BY m.number, mq."order", a.rank
    ''').fetchall()
    connection.close()
    matches = defaultdict(lambda: {"questions": {}})
    for row in rows:
        match = matches[row["match_number"]]
        match.update(stage=row["stage"], team_a=row["team_a"], team_b=row["team_b"])
        question = match["questions"].setdefault(row["round_order"], {
            "text": row["question_text"], "category": row["category"], "answers": []
        })
        question["answers"].append({"rank": row["rank"], "text": row["answer_text"], "points": row["points"]})
    if sorted(matches) != list(range(1, 16)) or any(sorted(m["questions"]) != [1, 2] for m in matches.values()):
        raise ValueError("The database must contain 15 matches with two questions each")
    return matches


def main():
    matches = load_matches()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    PREVIEW.mkdir(parents=True, exist_ok=True)
    previews = []
    with PdfPages(OUTPUT) as pdf:
        for number, match in sorted(matches.items()):
            fig = plt.figure(figsize=(8.27, 11.69), dpi=120, facecolor=PALE)
            fig.patches.append(Rectangle((0, 0.946), 1, 0.054,
                                         transform=fig.transFigure, facecolor=NAVY, edgecolor="none"))
            fig.patches.append(Rectangle((0, 0.942), 1, 0.004,
                                         transform=fig.transFigure, facecolor=GOLD, edgecolor="none"))
            draw_text(fig, 0.068, 0.972, "FEUD NIGHT", size=10, color="white", weight="bold")
            draw_text(fig, 0.932, 0.972, "HOST ANSWER SHEET", size=8.7, color="#d5edff", ha="right")
            draw_text(fig, 0.067, 0.916, match["stage"].replace("_", " "), size=8.5,
                      color=BLUE, weight="bold")
            draw_text(fig, 0.065, 0.882, f"MATCH {number:02d}", size=29, weight="bold")
            teams = f"{match['team_a'] or 'To be decided'}  vs  {match['team_b'] or 'To be decided'}"
            draw_text(fig, 0.934, 0.882, teams, size=9.5, ha="right")
            draw_text(fig, 0.067, 0.839,
                      "Read each question aloud. The match has two rounds.",
                      size=8.4, color="#54708e")
            for order, top in [(1, 0.792), (2, 0.504)]:
                draw_card(fig, top, order, match["questions"][order])
            draw_text(fig, 0.071, 0.201, "HOST NOTES", size=8.6, color=BLUE, weight="bold")
            for y in (0.173, 0.139, 0.105):
                fig.patches.append(Rectangle((0.070, y), 0.86, 0.0008,
                                             transform=fig.transFigure, facecolor="#c9dced", edgecolor="none"))
            fig.patches.append(Rectangle((0.066, 0.038), 0.868, 0.0008,
                                         transform=fig.transFigure, facecolor="#c9dced", edgecolor="none"))
            draw_text(fig, 0.067, 0.024, "Keep this sheet with the host", size=7.6, color="#708ba5")
            draw_text(fig, 0.932, 0.024, f"{number} / 15", size=7.6, color="#708ba5", ha="right")
            pdf.savefig(fig, facecolor=fig.get_facecolor())
            preview_path = PREVIEW / f"answer-sheet-{number:02d}.png"
            fig.savefig(preview_path, dpi=90, facecolor=fig.get_facecolor())
            previews.append(preview_path)
            plt.close(fig)
    thumbnails = []
    for preview in previews:
        with Image.open(preview) as image:
            thumbnail = ImageOps.contain(image.convert("RGB"), (300, 420))
            thumbnails.append(thumbnail.copy())
    contact = Image.new("RGB", (4 * 320, 4 * 440), "#d9e5f0")
    for index, thumbnail in enumerate(thumbnails):
        contact.paste(thumbnail, ((index % 4) * 320 + 10, (index // 4) * 440 + 10))
    contact.save(PREVIEW / "answer-sheet-contact.png")
    print(OUTPUT)


if __name__ == "__main__":
    main()
