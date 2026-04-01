"""
Automatic image optimization utility.
Compresses and resizes images on upload to reduce file size while maintaining quality.
"""
import io
import os
from PIL import Image

# Max dimensions for different image types
MAX_WIDTH = 1920
MAX_HEIGHT = 1920
LOGO_MAX = 512
THUMBNAIL_MAX = 400

# JPEG quality (1-100, higher = better quality but larger file)
JPEG_QUALITY = 82
WEBP_QUALITY = 80


def optimize_image(content: bytes, filename: str, max_width: int = MAX_WIDTH, max_height: int = MAX_HEIGHT) -> tuple[bytes, str]:
    """
    Optimize an image: resize if too large, compress, convert to efficient format.
    
    Args:
        content: Raw image bytes
        filename: Original filename (used to detect format)
        max_width: Maximum width in pixels
        max_height: Maximum height in pixels
    
    Returns:
        Tuple of (optimized_bytes, new_filename)
    """
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    
    # Skip non-image files (PDFs, docs, etc.)
    image_exts = {"jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "tif"}
    if ext not in image_exts:
        return content, filename
    
    try:
        img = Image.open(io.BytesIO(content))
    except Exception:
        # If we can't open it as an image, return original
        return content, filename
    
    # Convert RGBA/P to RGB for JPEG output (keep transparency for PNG/WebP if needed)
    original_mode = img.mode
    has_transparency = original_mode in ("RGBA", "LA", "P") and ext in ("png", "webp", "gif")
    
    # Resize if larger than max dimensions (maintain aspect ratio)
    w, h = img.size
    if w > max_width or h > max_height:
        ratio = min(max_width / w, max_height / h)
        new_w = int(w * ratio)
        new_h = int(h * ratio)
        img = img.resize((new_w, new_h), Image.LANCZOS)
    
    # Strip EXIF metadata to reduce size
    if hasattr(img, "info"):
        img.info.pop("exif", None)
    
    output = io.BytesIO()
    
    if has_transparency:
        # Keep as PNG for transparent images but optimize
        if original_mode == "P":
            img = img.convert("RGBA")
        img.save(output, format="PNG", optimize=True)
        new_ext = "png"
    elif ext in ("gif",):
        # Keep GIFs as-is (animated)
        return content, filename
    else:
        # Convert everything else to JPEG for best compression
        if img.mode != "RGB":
            img = img.convert("RGB")
        img.save(output, format="JPEG", quality=JPEG_QUALITY, optimize=True)
        # Update filename extension to jpg
        new_ext = "jpg"
    
    optimized = output.getvalue()
    
    # Only use optimized version if it's actually smaller
    if len(optimized) < len(content):
        new_filename = filename.rsplit(".", 1)[0] + "." + new_ext if "." in filename else filename + "." + new_ext
        return optimized, new_filename
    
    return content, filename


def optimize_logo(content: bytes, filename: str) -> tuple[bytes, str]:
    """Optimize a logo image - smaller max dimensions."""
    return optimize_image(content, filename, max_width=LOGO_MAX, max_height=LOGO_MAX)


def optimize_thumbnail(content: bytes, filename: str) -> tuple[bytes, str]:
    """Optimize a thumbnail/photo image."""
    return optimize_image(content, filename, max_width=THUMBNAIL_MAX, max_height=THUMBNAIL_MAX)
