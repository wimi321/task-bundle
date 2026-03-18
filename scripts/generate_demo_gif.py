#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
from tempfile import TemporaryDirectory

from PIL import Image, ImageDraw, ImageFont
import subprocess


ROOT = Path(__file__).resolve().parents[1]
OUT_GIF = ROOT / "assets" / "quick-demo.gif"
WIDTH = 1200
HEIGHT = 720
FPS = 10

BG_TOP = (16, 33, 46)
BG_BOTTOM = (34, 78, 100)
CARD = (10, 22, 32)
CARD_HEADER = (27, 52, 71)
CARD_BORDER = (52, 88, 110)
TEXT = (244, 238, 229)
MUTED = (191, 218, 223)
ACCENT = (123, 224, 212)
WARM = (255, 209, 139)
SUCCESS = (169, 241, 229)
STEP_IDLE = (48, 69, 85)

FONT_MONO_CANDIDATES = [
    "/System/Library/Fonts/Menlo.ttc",
    "/System/Library/Fonts/Supplemental/Menlo.ttc",
    "/Library/Fonts/Menlo.ttc",
]
FONT_UI_CANDIDATES = [
    "/System/Library/Fonts/SFNSMono.ttf",
    "/System/Library/Fonts/Supplemental/Andale Mono.ttf",
]


SCENES = [
    {
        "step": "init",
        "title": "Start with starter inputs",
        "subtitle": "Create the bundle scaffold in one command.",
        "command": "$ taskbundle init --out ./starter",
        "lines": [
            "Initialized starter bundle inputs at ./starter",
            "Next step: edit the files, then run",
            "`taskbundle pack --config ./taskbundle.config.json`.",
        ],
        "command_frames": 12,
        "line_frames": 4,
        "hold_frames": 10,
    },
    {
        "step": "pack",
        "title": "Pack the task into a bundle",
        "subtitle": "Turn task files into a replayable directory and archive.",
        "command": "$ taskbundle pack --config ./starter/taskbundle.config.json",
        "lines": [
            "Created bundle at ./starter/bundle-output",
            "Bundle ID: dec24525-e128-4f32-aa96-587f373eb13c",
            "Schema: 0.2.0",
            "Archive: ./starter/bundle-output.tar.gz",
        ],
        "command_frames": 14,
        "line_frames": 4,
        "hold_frames": 10,
    },
    {
        "step": "compare",
        "title": "Compare two runs on the same task",
        "subtitle": "See scores, metadata, and deltas side by side.",
        "command": "$ taskbundle compare ./examples/hello-world-bundle ./examples/hello-world-bundle-claude",
        "lines": [
            "Left tool: codex",
            "Right tool: claude-code",
            "Left score: 0.93",
            "Right score: 0.89",
            "Score delta: 0.04",
            "Workspace file delta: 0",
        ],
        "command_frames": 16,
        "line_frames": 3,
        "hold_frames": 12,
    },
    {
        "step": "report",
        "title": "Generate a benchmark-style summary",
        "subtitle": "Turn a folder of bundles into a readable leaderboard.",
        "command": "$ taskbundle report ./examples --out ./dist/benchmark-report.md",
        "lines": [
            "Bundles: 2",
            "Scored bundles: 2",
            "Average score: 0.91",
            "",
            "Ranking",
            "1. codex / gpt-5 | success | score 0.93",
            "2. claude-code / claude-sonnet-4 | success | score 0.89",
        ],
        "command_frames": 14,
        "line_frames": 3,
        "hold_frames": 16,
    },
]


def load_font(paths: list[str], size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in paths:
        if Path(path).exists():
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()

UI_TITLE = load_font(FONT_UI_CANDIDATES, 58)
UI_SUBTITLE = load_font(FONT_UI_CANDIDATES, 24)
UI_STEP = load_font(FONT_UI_CANDIDATES, 18)
MONO_CMD = load_font(FONT_MONO_CANDIDATES, 21)
MONO_TEXT = load_font(FONT_MONO_CANDIDATES, 19)


def make_background() -> Image.Image:
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_TOP)
    draw = ImageDraw.Draw(img)
    for y in range(HEIGHT):
        t = y / (HEIGHT - 1)
        color = tuple(int(BG_TOP[i] * (1 - t) + BG_BOTTOM[i] * t) for i in range(3))
        draw.line((0, y, WIDTH, y), fill=color)
    draw.rounded_rectangle((0, 0, WIDTH - 1, HEIGHT - 1), radius=28, outline=(70, 111, 131), width=1)
    draw.ellipse((920, 20, 1200, 300), fill=(255, 171, 104))
    draw.ellipse((874, -24, 1248, 350), outline=(255, 241, 216), width=2)
    draw.polygon(
        [(0, 560), (170, 500), (350, 488), (560, 560), (760, 546), (935, 500), (1200, 542), (1200, 720), (0, 720)],
        fill=(13, 27, 37),
    )
    return img


def draw_step_pills(draw: ImageDraw.ImageDraw, active_step: str) -> None:
    steps = [("init", "init"), ("pack", "pack"), ("compare", "compare"), ("report", "report")]
    x = 72
    y = 150
    gap = 16
    for key, label in steps:
        active = key == active_step
        w = 110 if key != "compare" else 138
        color = ACCENT if active else STEP_IDLE
        fill = tuple((*color,)) if active else STEP_IDLE
        outline = (154, 230, 219) if active else (86, 112, 127)
        draw.rounded_rectangle((x, y, x + w, y + 42), radius=21, fill=fill, outline=outline, width=2)
        text_fill = (16, 33, 46) if active else TEXT
        draw.text((x + 22, y + 11), label, font=UI_STEP, fill=text_fill)
        x += w + gap


def draw_scene(scene: dict, command_chars: int, visible_lines: int) -> Image.Image:
    img = make_background()
    draw = ImageDraw.Draw(img)

    draw.line((72, 74, 520, 74), fill=(106, 186, 185), width=3)
    draw.line((72, 100, 338, 100), fill=(71, 126, 135), width=3)
    draw.text((72, 204), "Quick Demo", font=UI_TITLE, fill=TEXT)
    draw.text((72, 274), scene["title"], font=UI_SUBTITLE, fill=WARM)
    draw.text((72, 314), scene["subtitle"], font=UI_SUBTITLE, fill=MUTED)
    draw_step_pills(draw, scene["step"])

    card_x, card_y, card_w, card_h = 72, 220 + 170, 1056, 280
    draw.rounded_rectangle((card_x, card_y, card_x + card_w, card_y + card_h), radius=26, fill=CARD, outline=CARD_BORDER, width=2)
    draw.rounded_rectangle((card_x, card_y, card_x + card_w, card_y + 60), radius=26, fill=CARD_HEADER)
    draw.rectangle((card_x, card_y + 30, card_x + card_w, card_y + 60), fill=CARD_HEADER)
    for idx, color in enumerate([(255, 142, 114), (255, 209, 139), (123, 224, 212)]):
        cx = card_x + 28 + idx * 24
        draw.ellipse((cx - 6, card_y + 24 - 6, cx + 6, card_y + 24 + 6), fill=color)
    draw.text((card_x + 84, card_y + 18), scene["step"], font=UI_STEP, fill=TEXT)

    terminal_x = card_x + 24
    terminal_y = card_y + 94
    prompt = scene["command"][:command_chars]
    draw.text((terminal_x, terminal_y), prompt, font=MONO_CMD, fill=ACCENT)

    line_y = terminal_y + 42
    visible = scene["lines"][:visible_lines]
    for line in visible:
        color = TEXT if not line.startswith(("Bundles", "Scored", "Average", "1.", "2.", "Ranking")) else MUTED
        if line.startswith(("Ranking", "Average", "1.", "2.")):
            color = WARM if line == "Ranking" else TEXT
        if line.startswith("Average"):
            color = SUCCESS
        draw.text((terminal_x, line_y), line, font=MONO_TEXT, fill=color)
        line_y += 30

    footer = "taskbundle demo: init -> pack -> compare -> report"
    draw.text((72, 660), footer, font=UI_STEP, fill=(196, 219, 223))
    return img


def build_frames() -> list[Image.Image]:
    frames: list[Image.Image] = []
    for scene in SCENES:
        command = scene["command"]
        for frame_index in range(scene["command_frames"]):
            count = max(1, int(len(command) * (frame_index + 1) / scene["command_frames"]))
            frames.append(draw_scene(scene, count, 0))
        for line_index in range(1, len(scene["lines"]) + 1):
            for _ in range(scene["line_frames"]):
                frames.append(draw_scene(scene, len(command), line_index))
        for _ in range(scene["hold_frames"]):
            frames.append(draw_scene(scene, len(command), len(scene["lines"])))
    return frames


def save_gif(frames: list[Image.Image]) -> None:
    with TemporaryDirectory() as tempdir:
        temp = Path(tempdir)
        for idx, frame in enumerate(frames):
            frame.save(temp / f"frame-{idx:04d}.png")
        palette = temp / "palette.png"
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-framerate",
                str(FPS),
                "-i",
                str(temp / "frame-%04d.png"),
                "-vf",
                "palettegen=stats_mode=diff",
                str(palette),
            ],
            check=True,
            capture_output=True,
        )
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-framerate",
                str(FPS),
                "-i",
                str(temp / "frame-%04d.png"),
                "-i",
                str(palette),
                "-lavfi",
                "fps=10,scale=1200:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3",
                str(OUT_GIF),
            ],
            check=True,
            capture_output=True,
        )


def main() -> None:
    frames = build_frames()
    save_gif(frames)
    print(f"Wrote {OUT_GIF.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
