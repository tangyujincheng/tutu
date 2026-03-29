from PIL import Image
import os
import sys

def compress_image(input_path, output_path, quality=60):
    """压缩图片"""
    with Image.open(input_path) as img:
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGBA')
        else:
            img = img.convert('RGB')
        img.save(output_path, optimize=True, quality=quality)
        
def main():
    frontend_dir = '/Users/jin/.openclaw/workspace/projects/bunny-letter-game/frontend'
    
    # 处理所有PNG
    for filename in os.listdir(frontend_dir):
        if filename.lower().endswith('.png') and filename != 'compress_images.py':
            input_path = os.path.join(frontend_dir, filename)
            temp_path = os.path.join(frontend_dir, f'_temp_{filename}')
            original_size = os.path.getsize(input_path)
            compress_image(input_path, temp_path, quality=50)
            compressed_size = os.path.getsize(temp_path)
            if compressed_size < original_size:
                os.remove(input_path)
                os.rename(temp_path, input_path)
                print(f"压缩PNG {filename}: {original_size/1024:.1f}KB → {compressed_size/1024:.1f}KB")
            else:
                os.remove(temp_path)
                print(f"跳过PNG {filename}: 压缩后更大")
    
    # 处理所有JPG/JPEG
    for filename in os.listdir(frontend_dir):
        if filename.lower().endswith(('.jpg', '.jpeg')):
            input_path = os.path.join(frontend_dir, filename)
            temp_path = os.path.join(frontend_dir, f'_temp_{filename}')
            original_size = os.path.getsize(input_path)
            compress_image(input_path, temp_path, quality=50)
            compressed_size = os.path.getsize(temp_path)
            if compressed_size < original_size:
                os.remove(input_path)
                os.rename(temp_path, input_path)
                print(f"压缩JPG {filename}: {original_size/1024:.1f}KB → {compressed_size/1024:.1f}KB")
            else:
                os.remove(temp_path)
                print(f"跳过JPG {filename}: 压缩后更大")

if __name__ == '__main__':
    main()
