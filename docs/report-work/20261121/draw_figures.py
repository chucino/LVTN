from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math

out = Path(__file__).resolve().parent
S = 2
font_dir = Path('C:/Windows/Fonts')
def font(size=28, bold=False):
    return ImageFont.truetype(str(font_dir / ('arialbd.ttf' if bold else 'arial.ttf')), size*S)
def canvas(w,h):
    im=Image.new('RGB',(w*S,h*S),'white')
    return im,ImageDraw.Draw(im)
def line(d, pts, width=2): d.line([(int(x*S),int(y*S)) for x,y in pts],fill='black',width=width*S)
def txt(d,xy,text,size=28,bold=False):
    d.multiline_text((xy[0]*S,xy[1]*S),text,font=font(size,bold),fill='black',anchor='mm',align='center',spacing=8*S)
def actor(d,x,y,label):
    d.ellipse(((x-16)*S,(y-66)*S,(x+16)*S,(y-34)*S),outline='black',width=2*S)
    line(d,[(x,y-34),(x,y+16)])
    line(d,[(x-28,y-12),(x+28,y-12)])
    line(d,[(x,y+16),(x-25,y+52)])
    line(d,[(x,y+16),(x+25,y+52)])
    txt(d,(x,y+88),label,25)
def ellipse(d,x,y,w,text):
    d.ellipse(((x-w/2)*S,(y-43)*S,(x+w/2)*S,(y+43)*S),outline='black',width=2*S)
    txt(d,(x,y),text,25)
def box(d,x,y,w,h,text,size=28):
    d.rounded_rectangle(((x-w/2)*S,(y-h/2)*S,(x+w/2)*S,(y+h/2)*S),radius=10*S,outline='black',width=2*S)
    txt(d,(x,y),text,size)
def arrow(d,pts,label=None,label_at=None):
    line(d,pts)
    x,y=pts[-1]; px,py=pts[-2]; a=math.atan2(y-py,x-px)
    wing=12
    tip=[(x,y),(x-wing*math.cos(a-.45),y-wing*math.sin(a-.45)),(x-wing*math.cos(a+.45),y-wing*math.sin(a+.45))]
    d.polygon([(int(a*S),int(b*S)) for a,b in tip],fill='black')
    if label: txt(d,label_at,label,24)

im,d=canvas(1200,1020)
d.rectangle((200*S,50*S,1000*S,980*S),outline='black',width=2*S)
txt(d,(600,85),'NEXTCODE',30,True)
actor(d,78,290,'Khách\ntruy cập')
actor(d,1120,500,'Học viên')
guest=[('Tìm và xem\nkhóa học',190),('Đăng ký và\nxác thực',385),('Tra cứu\nchứng chỉ',580)]
for text,y in guest:
    line(d,[(112,278),(250,y)])
    ellipse(d,415,y,330,text)
student=[('Quản lý hồ sơ',155),('Đăng ký\nkhóa miễn phí',260),('Mua khóa Pro',365),('Xem và kiểm tra\nđơn hàng',470),('Học và làm\ntrắc nghiệm',575),('Hỏi đáp và\nbáo cáo nội dung',680),('Đánh giá khóa',785),('Xem chứng chỉ',890)]
for text,y in student:
    line(d,[(1086,488),(965,y)])
    ellipse(d,795,y,340,text)
im.save(out/'usecase-learner.png')

im,d=canvas(1200,1000)
d.rectangle((200*S,50*S,1000*S,955*S),outline='black',width=2*S)
txt(d,(600,84),'NEXTCODE',30,True)
actor(d,78,400,'Giảng viên')
actor(d,1120,360,'Quản trị\nviên')
left=[('Biên soạn nội dung',185),('Gửi và thu hồi\nyêu cầu duyệt',365),('Theo dõi học viên',545),('Xử lý báo cáo\ntrong khóa',725)]
for text,y in left:
    line(d,[(112,388),(245,y)])
    ellipse(d,415,y,340,text)
right=[('Tạo và phân công\nkhóa học',185),('Quản lý nội dung\nvà xét duyệt',365),('Quản lý tài khoản',545),('Xử lý báo cáo\ntoàn hệ thống',725)]
for text,y in right:
    line(d,[(1086,348),(970,y)])
    ellipse(d,800,y,340,text)
ellipse(d,605,875,430,'Quản lý đơn hàng\nvà xác nhận thanh toán')
line(d,[(1086,348),(1040,348),(1040,875),(820,875)])
actor(d,78,835,'Kế toán')
line(d,[(112,823),(170,823),(170,875),(390,875)])
im.save(out/'usecase-management.png')

im,d=canvas(1200,1320)
box(d,600,62,460,76,'Xem khóa học và đăng nhập')
arrow(d,[(600,100),(600,142)])
diamond=[(600,142),(760,212),(600,282),(440,212)]
d.polygon([(x*S,y*S) for x,y in diamond],outline='black',width=2*S)
txt(d,(600,212),'Loại khóa học?',27)
arrow(d,[(440,212),(260,212),(260,310)],'Miễn phí',(280,180))
arrow(d,[(760,212),(940,212),(940,310)],'Pro',(920,180))
box(d,260,350,380,80,'Đăng ký khóa học')
box(d,940,350,380,80,'Tạo đơn và thanh toán QR')
arrow(d,[(940,390),(940,440)])
box(d,940,485,380,90,'Kiểm tra và xác nhận\nthanh toán')
arrow(d,[(940,530),(940,600),(600,600),(600,650)],'Đã xác nhận',(790,564))
arrow(d,[(260,390),(260,600),(600,600)])
box(d,600,695,520,90,'Có quyền học và mở bài đầu tiên')
arrow(d,[(600,740),(600,787)])
box(d,600,832,520,90,'Hoàn thành bài theo điều kiện\nxem, đọc và trắc nghiệm')
arrow(d,[(600,877),(600,923)])
diamond=[(600,923),(840,993),(600,1063),(360,993)]
d.polygon([(x*S,y*S) for x,y in diamond],outline='black',width=2*S)
txt(d,(600,993),'Đã hoàn thành toàn bộ bài?',25)
arrow(d,[(360,993),(195,993),(195,832),(340,832)],'Chưa: mở bài tiếp',(190,1090))
arrow(d,[(600,1063),(600,1122)],'Có',(645,1093))
box(d,600,1170,520,96,'Ghi nhận hoàn thành khóa\nvà cấp chứng chỉ')
txt(d,(600,1280),'Chưa xác nhận thanh toán thì chưa cấp quyền học Pro',25)
im.save(out/'flow-enrollment.png')
print('Created three report figures')

# Compact layout for the report page, preserving readable labels.
im,d=canvas(1300,970)
box(d,650,52,520,76,'Chọn khóa học và đăng nhập',30)
arrow(d,[(650,90),(650,120)])
d.polygon([(650*S,120*S),(835*S,190*S),(650*S,260*S),(465*S,190*S)],outline='black',width=2*S)
txt(d,(650,190),'Loại khóa học?',29)
arrow(d,[(465,190),(260,190),(260,270)],'Miễn phí',(285,150))
arrow(d,[(835,190),(1030,190),(1030,270)],'Pro',(1025,150))
box(d,260,310,400,80,'Đăng ký khóa học',29)
box(d,1030,310,420,80,'Tạo đơn và thanh toán QR',27)
arrow(d,[(1030,350),(1030,395)])
box(d,1030,440,420,90,'Kiểm tra và xác nhận\nthanh toán',29)
arrow(d,[(260,350),(260,520),(650,520)])
arrow(d,[(1030,485),(1030,520),(650,520),(650,550)],'Đã xác nhận',(1095,550))
box(d,650,595,560,90,'Cấp quyền học và mở bài đầu tiên',28)
arrow(d,[(650,640),(650,670)])
box(d,650,715,560,90,'Hoàn thành bài theo điều kiện\nxem, đọc và trắc nghiệm',29)
arrow(d,[(650,760),(650,785)])
d.polygon([(650*S,785*S),(855*S,850*S),(650*S,915*S),(445*S,850*S)],outline='black',width=2*S)
txt(d,(650,850),'Hoàn thành toàn khóa?',27)
arrow(d,[(445,850),(200,850),(200,715),(370,715)],'Chưa: mở bài tiếp',(192,901))
arrow(d,[(855,850),(910,850)],'Có',(883,818))
box(d,1100,850,370,96,'Ghi nhận hoàn thành\nvà cấp chứng chỉ',27)
im.save(out/'flow-enrollment.png')
