from PIL import Image
import glob
import os

# 打开GIF文件
input_gif_path = "兔子动图1 test.gif"
output_gif_path = "兔子动图1 透明背景.gif"

# 打开GIF
gif = Image.open(input_gif_path)

# 存储所有处理后的帧
frames = []

# 遍历GIF的每一帧
for i in range(gif.n_frames):
    gif.seek(i)
    # 转换为RGBA模式支持透明度
    frame = gif.convert("RGBA")
    
    # 获取像素数据
    datas = frame.getdata()
    
    # 创建新的像素数据，将接近白色的背景设置为透明
    new_data = []
    for item in datas:
        # 判断是否为浅色背景（根据实际情况调整阈值）
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            # 背景色，设置为透明
            new_data.append((255, 255, 255, 0))
        else:
            # 保留原图
            new_data.append(item)
    
    frame.putdata(new_data)
    frames.append(frame)

# 保存处理后的GIF
frames[0].save(output_gif_path, save_all=True, append_images=frames[1:], 
               duration=gif.info.get('duration', 100), loop=0, disposal=2)

print(f"背景去除完成，已保存为: {output_gif_path}")
print(f"原始文件大小: {os.path.getsize(input_gif_path)} bytes")
print(f"输出文件大小: {os.path.getsize(output_gif_path)} bytes")
