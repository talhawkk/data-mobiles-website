import cv2
import os
import glob
import numpy as np

# Find raw webm in recordings
webm_files = sorted(glob.glob('recordings/*.webm'), key=os.path.getmtime, reverse=True)
if not webm_files:
    print("No webm files found in recordings!")
    exit(1)

input_path = webm_files[0]
print(f"Reading input: {input_path}")

cap = cv2.VideoCapture(input_path)
fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

start_sec = 1.8
end_sec = 56.0

start_frame = int(start_sec * fps)
end_frame = min(total_frames, int(end_sec * fps))

print(f"Trimming from {start_sec}s (frame {start_frame}) to {end_sec}s (frame {end_frame})")

# 1. Output 1: Standard 720p Showcase
output_720 = 'recordings/DATA-showcase-720p.mp4'
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out_720 = cv2.VideoWriter(output_720, fourcc, fps, (w, h))

# 2. Output 2: Claude-Optimized Showcase (960x540, ~25s duration, smooth 2x pace, < 6MB)
output_claude = 'recordings/DATA-claude-review.mp4'
# Sample frames with step=2 to achieve a snappy 25s overview at 24fps
out_claude = cv2.VideoWriter(output_claude, fourcc, 24.0, (960, 540))

cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
curr_frame = start_frame

while cap.isOpened() and curr_frame <= end_frame:
    ret, frame = cap.read()
    if not ret:
        break

    out_720.write(frame)

    # For Claude: sample every 2nd frame
    if curr_frame % 2 == 0:
        claude_frame = cv2.resize(frame, (960, 540), interpolation=cv2.INTER_AREA)
        out_claude.write(claude_frame)

    curr_frame += 1

cap.release()
out_720.release()
out_claude.release()

size_720 = os.path.getsize(output_720) / (1024 * 1024)
size_claude = os.path.getsize(output_claude) / (1024 * 1024)

print("\nVIDEOS SUCCESSFULLY GENERATED:")
print(f"1. Master 720p (54s): {output_720} ({size_720:.2f} MB)")
print(f"2. Claude.ai Review (~25s, 960x540): {output_claude} ({size_claude:.2f} MB)")
