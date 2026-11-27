from pathlib import Path
import json, math
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parent
S=4
FONT=Path('C:/Windows/Fonts/arial.ttf')
BOLD=Path('C:/Windows/Fonts/arialbd.ttf')
LABELS={
 1:'Đăng ký và xác thực email',2:'Đăng nhập, duy trì phiên và đăng xuất',3:'Khôi phục mật khẩu',
 4:'Quản lý hồ sơ và đổi mật khẩu',5:'Xem thông báo',6:'Tìm và xem khóa học',7:'Tra cứu chứng chỉ',
 8:'Đăng ký khóa miễn phí',9:'Đặt mua khóa Pro',10:'Thanh toán và quản lý đơn cá nhân',
 11:'Học bài và lưu tiến độ',12:'Làm trắc nghiệm',13:'Nhận, xem và in chứng chỉ',
 14:'Đánh giá khóa học',15:'Thảo luận hỏi đáp',16:'Báo cáo nội dung vi phạm',
 17:'Tạo và quản lý thông tin khóa',18:'Biên soạn nội dung khóa học',19:'Gửi duyệt và quản lý công bố',
 20:'Theo dõi học viên',21:'Xử lý báo cáo vi phạm',22:'Quản lý đơn và xác nhận thanh toán',23:'Quản lý người dùng và phân quyền'}

def wrapped(draw,text,font,maxwidth):
    words=text.split();lines=[];line=''
    for w in words:
        v=(line+' '+w).strip()
        if draw.textlength(v,font=font)>maxwidth and line:lines.append(line);line=w
        else:line=v
    if line:lines.append(line)
    return lines

def render(name,ids,actor_specs,service_specs,columns=2):
    width=450
    rows=math.ceil(len(ids)/columns)
    gap=47 if rows>=8 else 63
    height=rows*gap+50
    im=Image.new('RGB',(width*S,height*S),'white');d=ImageDraw.Draw(im)
    def line(points,color='#777777',width=0.65):
        d.line([(int(x*S),int(y*S)) for x,y in points],fill=color,width=max(1,int(width*S)))
    def box(b,kind='ellipse'):
        coords=[int(v*S) for v in b]
        getattr(d,kind)(coords,fill='white',outline='#222222',width=3)
    def label(x,y,text,size=8.3,bold=False,maxwidth=130):
        font=ImageFont.truetype(str(BOLD if bold else FONT),round(size*S))
        ls=wrapped(d,text,font,maxwidth*S);lh=size*1.18*S
        yy=y*S-len(ls)*lh/2
        for t in ls:
            d.text((x*S,yy),t,fill='black',font=font,anchor='mt');yy+=lh
    left,right=64,386
    d.rectangle([left*S,12*S,right*S,(height-7)*S],outline='#222222',width=3)
    label(225,21,'NEXTCODE',9,bold=True,maxwidth=285)
    nodes={}
    for k,n in enumerate(ids):
        col=k//rows if columns==2 else 0
        row=k%rows
        cx=left+(right-left)/2 if columns==1 else left+80+col*161
        cy=49+row*gap
        nodes[n]=(cx,cy,143 if columns==2 else 230,38 if columns==2 else 45)
    # Relations are taken from the supplied models; grouping is only for page layout.
    for label_text,cy,links in actor_specs+service_specs:
        is_service=(label_text,cy,links) in service_specs
        ax=421 if is_service else 27
        anchor=(ax,cy)
        for n in links:
            if n not in nodes:continue
            nx,ny,nw,nh=nodes[n]
            dx,dy=ax-nx,cy-ny
            scale=1/math.sqrt((dx/(nw/2))**2+(dy/(nh/2))**2)
            edge=(nx+dx*scale,ny+dy*scale)
            if columns==2 and ((ax<left and nx>225) or (ax>right and nx<225)):
                # Route cross-column associations through the gap between the rows.
                outer=53 if ax<left else 397
                gap_y=ny+gap/2
                edge=(nx-nw/2,ny) if nx>225 else (nx+nw/2,ny)
                line([anchor,(outer,cy),(outer,gap_y),(225,gap_y),(225,ny),edge])
            else:line([anchor,edge])
    for n,(cx,cy,nw,nh) in nodes.items():
        box((cx-nw/2,cy-nh/2,cx+nw/2,cy+nh/2))
        content=f'UC{n:02d}  '+LABELS[n]
        if name=='instructor' and n==11:content='UC11, UC12  Xem thử bài học và trắc nghiệm'
        if name=='instructor' and n==19:content='UC19  Gửi và thu hồi yêu cầu duyệt'
        if name=='instructor' and n==21:content='UC21  Xử lý báo cáo trong khóa phụ trách'
        if name=='admin' and n==19:content='UC19  Xét duyệt và quản lý công bố'
        label(cx,cy,content,8.4 if columns==2 else 10,maxwidth=nw-15)
    for text,cy,links in actor_specs+service_specs:
        is_service=(text,cy,links) in service_specs
        ax=421 if is_service else 27
        # White backing keeps the actor legible where several association lines meet.
        d.rectangle([(ax-22)*S,(cy-18)*S,(ax+22)*S,(cy+46)*S],fill='white')
        d.ellipse([(ax-5)*S,(cy-16)*S,(ax+5)*S,(cy-6)*S],outline='black',width=3)
        line([(ax,cy-6),(ax,cy+9)],'black',0.8)
        line([(ax-10,cy),(ax+10,cy)],'black',0.8)
        line([(ax,cy+9),(ax-9,cy+22)],'black',0.8)
        line([(ax,cy+9),(ax+9,cy+22)],'black',0.8)
        label(ax,cy+35,text,7.4,bold=True,maxwidth=54)
    im.save(ROOT/(name+'.png'))
    small=im.copy();small.thumbnail((1100,1500));small.save(ROOT/(name+'-preview.png'))

render('overview',list(range(1,24)),
 [('Khách truy cập',105,[1,2,3,6,7]),('Học viên',310,[2,4,5,6,7,8,9,10,11,12,13,14,15,16])],
 [('Dịch vụ email',80,[1,3]),('payOS',230,[9,10,22]),
  ('Giảng viên',390,[18,19,20,21,15]),('Quản trị viên',550,[17,18,19,20,21,22,23])])
render('student',list(range(1,17)),
 [('Khách truy cập',90,[1,2,3,6,7]),('Học viên',300,[2,4,5,6,7,8,9,10,11,12,13,14,15,16])],
 [('Dịch vụ email',90,[1,3]),('payOS',300,[9,10])])
render('instructor',[18,11,19,20,15,21],
 [('Giảng viên',205,[18,11,19,20,15,21])],[],columns=1)
render('admin',[17,18,19,20,21,22,23],
 [('Quản trị viên',230,[17,18,19,20,21,22,23])], [('payOS',364,[22])],columns=1)
print('Generated four report diagrams from the verified use case model')
