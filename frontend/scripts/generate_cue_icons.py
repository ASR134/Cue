import os
from PIL import Image, ImageOps

source_path = r"C:\Users\Aman\.gemini\antigravity-ide\brain\4e12ad03-cc03-4036-a42a-19b33e8c775c\.user_uploaded\media_1792781136279.jpg"
out_dir = r"c:\Users\Aman\OneDrive\Documents\youtube_chat\frontend\public\icons"
assets_dir = r"c:\Users\Aman\OneDrive\Documents\youtube_chat\frontend\src\assets"

os.makedirs(out_dir, exist_ok=True)
os.makedirs(assets_dir, exist_ok=True)

im = Image.open(source_path).convert("RGBA")
width, height = im.size

# The image is 1024x1024. The squircle card has a warm-white background,
# and outside the squircle is black (background).
# Let's inspect the bounding box of the non-black pixels:
# A pixel is background if r < 20 and g < 20 and b < 20.
pixels = im.load()

# Create an alpha mask where black corners are transparent
# Smooth thresholding for anti-aliasing:
alpha = Image.new("L", (width, height), 0)
alpha_pixels = alpha.load()

for y in range(height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        # Check brightness
        brightness = (r + g + b) / 3.0
        if brightness > 30:
            alpha_pixels[x, y] = 255
        elif brightness > 5:
            # Soft anti-aliased edge
            alpha_pixels[x, y] = int((brightness / 30.0) * 255)
        else:
            alpha_pixels[x, y] = 0

im.putalpha(alpha)

# Find bounding box of non-zero alpha
bbox = im.getbbox()
print("Card bounding box:", bbox)

# Crop to squircle card
cropped = im.crop(bbox)
c_w, c_h = cropped.size
# Make square
side = max(c_w, c_h)
square_im = Image.new("RGBA", (side, side), (0, 0, 0, 0))
offset_x = (side - c_w) // 2
offset_y = (side - c_h) // 2
square_im.paste(cropped, (offset_x, offset_y))

# Save sizes: 16, 32, 48, 128
for size in [16, 32, 48, 128]:
    resized = square_im.resize((size, size), Image.Resampling.LANCZOS)
    out_file = os.path.join(out_dir, f"icon-{size}.png")
    resized.save(out_file, "PNG")
    print(f"Saved {out_file} ({size}x{size})")

# Save high-res logo for header in assets
logo_header = square_im.resize((96, 96), Image.Resampling.LANCZOS)
logo_header.save(os.path.join(assets_dir, "cue-logo.png"), "PNG")
# Also save full-res cropped in assets
square_im.resize((256, 256), Image.Resampling.LANCZOS).save(os.path.join(assets_dir, "cue-logo-256.png"), "PNG")
print("Saved header logos in src/assets/")
