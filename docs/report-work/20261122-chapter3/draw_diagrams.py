from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math
R=Path(__file__).resolve().parent;S=3
def font(sz,b=False):return ImageFont.truetype('C:/Windows/Fonts/'+('timesbd.ttf' if b else 'times.ttf'),round(sz*S))
def canvas(h):
 global im,d
 im=Image.new('RGB',(447*S,round(h*S)),'white');d=ImageDraw.Draw(im)
def line(points,arrow=False,dash=False):
 pts=[(int(x*S),int(y*S)) for x,y in points]
 if dash:
  for a,b in zip(pts,pts[1:]):
   dist=math.dist(a,b)
   for k in range(0,int(dist),18):
    t=k/dist;u=min(k+10,dist)/dist
    d.line([(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t),(a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u)],fill='black',width=2)
 else:d.line(pts,fill='black',width=2)
 if arrow:
  a,b=pts[-2:];ang=math.atan2(b[1]-a[1],b[0]-a[0]);size=6*S
  tri=[b,(b[0]-size*math.cos(ang-.45),b[1]-size*math.sin(ang-.45)),(b[0]-size*math.cos(ang+.45),b[1]-size*math.sin(ang+.45))]
  d.polygon(tri,fill='black')
def label(x,y,s,sz=11,b=False,anchor='mm'):
 d.multiline_text((x*S,y*S),s,font=font(sz,b),fill='black',anchor=anchor,align='center',spacing=2*S)
def box(x,y,w,h,s,b=False,sz=11,fill='white'):
 d.rectangle((round(x*S),round(y*S),round((x+w)*S),round((y+h)*S)),fill=fill,outline='black',width=2)
 label(x+w/2,y+h/2,s,sz,b)
def save(name):im.save(R/(name+'.png'),dpi=(216,216))

canvas(300)
box(5,35,125,70,'TRÌNH DUYỆT\nVue và các trang\nAxios gọi API',True)
box(180,35,260,70,'MÁY CHỦ NESTJS\nController → Service → Model\nXác thực và kiểm tra nghiệp vụ',True)
line([(130,58),(180,58)],True);line([(180,83),(130,83)],True);label(155,20,'HTTP',10)
box(10,173,125,70,'MongoDB\nTài khoản, khóa học\nTiến độ và đơn hàng')
box(165,173,125,70,'Thư mục public\nẢnh, video, tài liệu\nĐường dẫn /public/')
box(320,149,120,45,'SMTP\nGửi mã xác minh')
box(320,219,120,45,'payOS\nTạo và kiểm tra\nthanh toán')
line([(215,105),(215,132),(72,132),(72,173)],True)
line([(265,105),(265,145),(227,145),(227,173)],True)
line([(380,105),(380,149)],True);line([(440,80),(445,80),(445,241),(440,241)],True)
label(223,285,'Đường nối thể hiện trao đổi giữa các thành phần.',10)
save('architecture')

def tree(name,root,groups):
 total=sum(len(leaves) for _,leaves in groups)
 h=max(300,total*25+(len(groups)-1)*15+24)
 canvas(h)
 rootx,rootw=3,72;gx,gw=105,110;lx,lw=245,199
 centers=[];y=12
 for title,leaves in groups:
  cy=y+(len(leaves)*25-3)/2;centers.append(cy)
  box(gx,cy-20,gw,40,title,True,11,fill='#f3f3f3')
  line([(gx+gw,cy),(lx-12,cy)])
  leafcenters=[]
  for s in leaves:
   box(lx,y,lw,22,s,sz=10.5);leafcenters.append(y+11);y+=25
  line([(lx-12,leafcenters[0]),(lx-12,leafcenters[-1])])
  for yy in leafcenters:line([(lx-12,yy),(lx,yy)])
  y+=15
 cy=(centers[0]+centers[-1])/2;box(rootx,cy-37,rootw,74,root,True,11)
 line([(rootx+rootw,cy),(90,cy)]);line([(90,centers[0]),(90,centers[-1])])
 for yy in centers:line([(90,yy),(gx,yy)])
 save(name)
tree('function-overview','NEXTCODE',[
 ('Tài khoản',['Đăng ký và xác minh','Đăng nhập, khôi phục phiên','Cập nhật hồ sơ, mật khẩu']),
 ('Tra cứu',['Tìm và xem khóa học','Tra cứu chứng chỉ']),
 ('Đăng ký\nvà thanh toán',['Đăng ký khóa miễn phí','Tạo đơn và thanh toán Pro']),
 ('Học tập',['Học bài và lưu tiến độ','Trắc nghiệm và chứng chỉ']),
 ('Nội dung\nkhóa học',['Biên soạn và gửi duyệt','Phê duyệt, công bố, ẩn']),
 ('Tương tác\nvà quản trị',['Hỏi đáp, đánh giá, phản ánh','Quản lý người dùng, đơn hàng']),
])
tree('function-student','KHÁCH\nVÀ\nHỌC VIÊN',[
 ('Tra cứu',['Tìm, lọc, xem khóa học','Xác thực chứng chỉ bằng mã']),
 ('Tài khoản',['Đăng ký và xác minh email','Đăng nhập, đặt lại mật khẩu','Hồ sơ, mật khẩu, thông báo']),
 ('Đăng ký học',['Đăng ký khóa miễn phí','Mua Pro và theo dõi đơn']),
 ('Học tập',['Xem bài, đọc tài liệu','Làm trắc nghiệm cuối bài','Xem tiến độ và chứng chỉ']),
 ('Tương tác',['Hỏi đáp và bày tỏ cảm xúc','Đánh giá khi đủ điều kiện','Phản ánh nội dung vi phạm']),
])
tree('function-instructor','GIẢNG\nVIÊN',[
 ('Khóa được\nphân công',['Xem, tìm và lọc khóa','Biên soạn chương và bài']),
 ('Học liệu\nvà câu hỏi',['Video, bài đọc, tài liệu','Ghi chép, tóm tắt, trắc nghiệm','Sắp xếp nội dung']),
 ('Kiểm tra\nvà gửi duyệt',['Xem thử và làm thử câu hỏi','Kiểm tra điều kiện sẵn sàng','Gửi duyệt hoặc thu hồi']),
 ('Học viên\nvà phản ánh',['Xem danh sách và tiến độ','Giải đáp trong khóa phụ trách','Xử lý hoặc chuyển báo cáo']),
])
tree('function-admin','QUẢN\nTRỊ\nVIÊN',[
 ('Người dùng',['Xem và tạo tài khoản','Phân quyền, khóa, mở khóa']),
 ('Khóa học',['Tạo khóa và định giá','Phân công giảng viên','Biên soạn, xem thử nội dung']),
 ('Công bố',['Duyệt hoặc từ chối có lý do','Ẩn và hiện lại khóa']),
 ('Vận hành',['Theo dõi học viên','Xử lý phản ánh, hạn chế tài khoản','Quản lý đơn, xác nhận thanh toán']),
])

canvas(325)
box(3,28,112,62,'users\nTài khoản',True)
box(167,28,112,62,'enrollments\nĐăng ký học',True)
box(332,28,112,62,'courses\nKhóa học',True)
line([(167,62),(115,62)],True);label(140,45,'studentId',9.5)
line([(279,62),(332,62)],True);label(306,45,'courseId',9.5)
box(167,161,112,62,'lesson_progresses\nTiến độ bài',True,10.5)
line([(223,161),(223,90)],True);label(268,124,'enrollmentId',10)
box(3,249,112,56,'certificates\nChứng chỉ',True)
line([(59,249),(59,90)],True);label(96,178,'studentId',10)
line([(115,277),(440,277),(440,90)],True);label(339,266,'courseId',10)
box(332,133,100,88,'Nội dung lồng:\nchapters\nlessons\nquizQuestions',sz=10.5)
line([(388,90),(388,133)],dash=True);label(356,110,'lưu lồng',9.5)
label(223,12,'Các liên kết chính trong dữ liệu học tập',11,True)
save('data-learning')

canvas(345)
box(3,30,165,61,'orders\nĐơn hàng\nstudentId và courseId',True)
box(277,30,167,61,'payment_transactions\nGiao dịch thanh toán',True,10.5)
line([(277,63),(168,63)],True);label(223,46,'orderId',10)
box(3,143,142,62,'lesson_comments\nCâu hỏi và trả lời',True)
box(302,143,142,62,'course_reviews\nĐánh giá khóa học',True)
box(167,249,112,62,'reports\nBáo cáo vi phạm',True)
line([(167,277),(74,277),(74,205)],True);label(92,237,'targetId',10)
line([(279,277),(373,277),(373,205)],True);label(351,237,'targetId',10)
label(223,114,'Tương tác liên kết người viết với khóa học',10)
label(223,329,'targetType phân biệt câu hỏi, câu trả lời hoặc đánh giá.',10)
save('data-operations')

def flow(name,steps,notes):
 h=len(steps)*55+12;canvas(h)
 for i,s in enumerate(steps):
  y=5+i*55;box(12,y,300,40,s,sz=11)
  if i<len(steps)-1:line([(162,y+40),(162,y+55)],True)
 for i,s in notes:box(327,5+i*55,113,40,s,sz=9.5,fill='#f3f3f3')
 save(name)
flow('payment-flow',[
 'Học viên yêu cầu mua khóa Pro',
 'Máy chủ kiểm tra khóa, quyền sở hữu\nvà tính số tiền từ dữ liệu khóa học',
 'Tạo đơn và thông tin thanh toán payOS',
 'Nhận webhook hoặc tra cứu lại thanh toán\nKiểm tra dữ liệu và đối chiếu đơn',
 'Ghi nhận giao dịch\nCập nhật đơn COMPLETED',
 'Tạo hoặc sử dụng đăng ký đã có\nCung cấp quyền học',
],[(1,'Không hợp lệ:\ntrả thông báo'),(3,'Chưa đủ tiền:\nchưa hoàn tất')])
flow('learning-flow',[
 'Kiểm tra đăng ký, bài học\nvà trạng thái được mở',
 'Ghi nhận nội dung đã học\nVideo đạt ngưỡng 60% thời lượng',
 'Nếu có trắc nghiệm, chấm tại máy chủ\nMột câu đúng; nhiều câu đạt ít nhất 70%',
 'Đánh dấu bài COMPLETED\nMở bài tiếp theo nếu còn',
 'Tính tỷ lệ bài hoàn thành\nCập nhật đăng ký học',
 'Tất cả bài hoàn thành và có ít nhất một bài:\nGhi nhận hoàn thành, cấp chứng chỉ',
],[(0,'Bài LOCKED:\ntừ chối'),(2,'Chưa đạt:\ncho làm lại')])
print('Drew 9 diagrams from project functions and schemas')
