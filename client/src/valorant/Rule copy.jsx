import React from "react";
import { useEffect } from "react";
export default function Rule(){
  useEffect(() => {
    const scrollToTop = () => {
        document.documentElement.scrollTop = 0;
        setLoading(false);
    };
    document.title = "Luật lệ"
    // Delay to show loading indicator and scroll to top
    setTimeout(scrollToTop, 0); // Adjust delay as needed
}, []);
    return(
        <div className='rule animate__animated animate__fadeIn mx-auto max-w-7xl px-2 sm:px-6 -z-50 relative mt-28'>
          <h2>LUẬT LỆ</h2>
          <div className='rule1'>
            <ul>
              <li>
                <h4>1. Giới thiệu về giải đấu và lí do tạo giải</h4>
                <ul>
                  <li>1. 1. Giới thiệu</li>
                  <p>&rarr; Giải đấu Valorant Dong Chuyen Nghiep được tổ chức nhằm mục đích giúp các bạn
                    giải trí sau những ngày học căng thẳng
                    và giúp các bạn làm quen và giao lưu với nhau.
                  </p>
                  <li>1. 2. Tại sao tụi mình lại tổ chức giải này?</li>
                  <p>&rarr; Lí do tụi mình tổ chức giải này là bởi vì tụi mình muốn tạo một sân chơi thú vị cho mọi người.
                  </p>
                  <li>1. 3. Liệu có giải thưởng cho giải đấu này không?</li>
                  <p>&rarr; Hiện tại tụi mình chưa đủ kinh tế hay có người quản lí kinh tế, với cả đã đụng tới
                    tiền thì mọi thứ sẽ phức tạp, nên tụi mình quyết định giải này sẽ chỉ có giải thưởng là đăng bài
                    chúc mừng trên page <i>DONG CHUYEN NGHIEP</i> thôi nhé.
                  </p>
                </ul>
              </li>
              <li>
                <h4>2. Điều kiện đăng kí, số lượng thành viên mỗi đội, giải thưởng</h4>
                <ul>
                  <li>2. 1. Điều kiện đăng kí</li>
                  <ul>
                    <li style={{ listStyle: 'circle', marginLeft: '20px' }}>Tất cả mọi người đều có thể tham gia.</li>
                    <li style={{ listStyle: 'circle', marginLeft: '20px' }}>Rank: Không giới hạn.</li>
                    <li>Note: Nếu bạn muốn biết đội hình mình đã đăng kí thành công hay chưa, các bạn có thể check ở "Các đội đã đăng kí" ngay sau khi điền form đăng kí xong.</li>
                  </ul>
                  <li>2. 2. Số lượng thành viên trong đội</li>
                  <ul>
                    <li style={{ listStyle: 'circle', marginLeft: '20px' }}>Tối thiểu là 5 tuyển thủ chính + 1 huấn luyện viên.</li>
                    <li style={{ listStyle: 'circle', marginLeft: '20px' }}>Tối đa là 10 thành viên gồm 5 tuyển thủ chính + 1 HLV + 4 thành viên dự bị.</li>
                  </ul>
                  <li>2. 3. Tiền thưởng và giải thưởng</li>
                  <p>Mục 1.3</p>
                </ul>
              </li>
              <li>
                <h4>3. Đội hình thi đấu và lưu ý về đội hình</h4>
                <ul>
                  <li style={{ listStyle: 'circle', marginLeft: '20px' }}>Gồm 5 (hoặc 4 nếu thiếu người) người chơi.</li>
                  <li style={{ listStyle: 'circle', marginLeft: '20px' }}>Trong lúc đang diễn ra ván đấu, không thực hiện thay người.</li>
                  <li style={{ listStyle: 'circle', marginLeft: '20px' }}>Đội tuyển khi muốn thay tuyển thủ thi đấu giữa các trận đấu phải khai báo tuyển thủ rời và tuyển thủ vào.</li>
                  <li style={{ listStyle: 'circle', marginLeft: '20px' }}>Đội hình thi đấu đảm bảo sử dụng đúng tài khoản đã cung cấp cho BTC.</li>
                </ul>
              </li>
              <li>
                <h4>4. Map pool</h4>
                <ul>
                  <li style={{ marginLeft: '20px' }}>7 map được sử dụng trong thi đấu bao gồm:</li>
                  <li style={{ listStyle: 'circle', marginLeft: '20px' }}>Ascent</li>
                  <li style={{ listStyle: 'circle', marginLeft: '20px' }}>Icebox</li>
                  <li style={{ listStyle: 'circle', marginLeft: '20px' }}>Haven</li>
                  <li style={{ listStyle: 'circle', marginLeft: '20px' }}>Bind</li>
                  <li style={{ listStyle: 'circle', marginLeft: '20px' }}>Lotus</li>
                  <li style={{ listStyle: 'circle', marginLeft: '20px' }}>Split</li>
                  <li style={{ listStyle: 'circle', marginLeft: '20px' }}>Sunset</li>
                </ul>
              </li>
              <li>
                <h4>5. Phần mềm thứ ba</h4>
                <ul>
                  <li>Các bạn có thể sử dụng phần mềm quay video hoặc ghi nhận dữ liệu, nhưng NGHIÊM CẤM sử dụng phần mềm thứ 3 để gian lận. (Mình không bắt thì Vanguard cũng bắt thôi).</li>
                </ul>
              </li>
              <li>
                <h4>6. Lịch và thời gian thi đấu</h4>
                <ul>
                  <li>6. 1. Lịch thi đấu</li>
                  <ul>
                    <li style={{ listStyle: 'circle' }}>Sẽ thông báo sau</li>
                  </ul>
                  <li>6. 2. Thời gian thi đấu</li>
                  <ul>
                    <li style={{ listStyle: 'circle' }}>Các trận sẽ diễn ra trong khung giờ từ 19h30-22h00 vào tối thứ 6,7 và Chủ Nhật.</li>
                  </ul>
                </ul>
              </li>
              <li>
                <h4>7. Địa điểm thi đấu: Online.</h4>
              </li>
              <li>
                <h4>8. Thể thức thi đấu</h4>
                <ul>
                  <li style={{ listStyle: 'circle' }}>Vòng Swiss Stage: BO1 vòng 0-0, BO3 các trận còn lại</li>
                  <li style={{ listStyle: 'circle' }}>Vòng Swiss Stage: BO3 các trận, riêng chung kết BO5</li>
                </ul>
              </li>
              <li>
                <h4>9. Số lượng team mỗi vòng đấu</h4>
                <ul>
                  <li style={{ listStyle: 'circle' }}>Vòng Swiss Stage: 8 đội</li>
                  <li style={{ listStyle: 'circle' }}>Vòng Play-off: 4 đội</li>
                </ul>
              </li>
              <li>
                <h4>10. Chế độ thi đấu:</h4>
                <ul>
                  <li>Đấu giải (Tournament mode)</li>
                </ul>
              </li>
              <li>
                <h4>11. BAN/PICK:</h4>
                <ul>
                  <li>
                    <p>Ban/pick map theo đường web các trọng tài chỉ định.</p>
                  </li>
                </ul>
              </li>
              <li>
                <h4>12. Nghỉ giữa hiệp và các Timeout</h4>
                <ul>
                  <li style={{ listStyle: 'circle' }}>Các bạn sẽ được nghỉ 2 phút khi đổi bên (Half-time)</li>
                  <li style={{ listStyle: 'circle' }}>Tactical Timeout: Mỗi team sẽ được hội ý 2 lần, mỗi bên 1 lần. Các thành viên có thể sử dụng Tactical Timeout khi cần thiết</li>
                  <li style={{ listStyle: 'circle' }}>Technical Timeout: 1 thành viên sẽ chat all nêu lí do để chủ phòng bật lên.</li>
                </ul>
              </li>
              <li>
                <h4>13. Thi đấu chấp người</h4>
                <ul>
                  <p>Giải đấu này cho phép các bạn thi đấu thiếu người. Lưu ý là chỉ được áp dụng trường hợp này khi chỉ có ĐÚNG 4 bạn thi đấu được ngày hôm đó. Không áp dụng cho các trường hợp khác.</p>
                </ul>
              </li>
              <li>
                <h4>14. Những điều cần lưu ý</h4>
                <ul>
                  <li style={{ listStyle: 'circle' }}>Thời gian: Các team PHẢI có mặt trong <a href="https://discord.gg/PnE9hzrkvr">Call Discord của Trường Trung học Phổ thông Phú Nhuận</a> trước 30 phút trận đấu diễn ra (click vào dòng chữ cam để chuyển tiếp tới Discord).</li>
                  <li style={{ listStyle: 'circle' }}>Về việc tạo phòng, các trọng tài sẽ tạo rồi out (các bạn tự bắn với nhau nhé).</li>
                  <li style={{ listStyle: 'circle' }}>Sau khi đấu xong thì đội trưởng của đội chiến thắng gửi ID trận đấu trên Valorant Tracker vào Thread. (Mình sẽ hướng dẫn chi tiết hơn ở trong Kênh)</li>
                  <li style={{ listStyle: 'circle' }}>Technical Timeout chỉ diễn ra khi có vấn đề riêng tư hay lỗi kĩ thuật nặng như là lỗi mạng, drop FPS quá nặng hoặc là crash game. Team cần Technical Timeout sẽ bật lên và chat all lí do cần ngừng.</li>
                </ul>
              </li>
              <li>
                <h4>15. Penalty</h4>
                <ul>
                  <li style={{ listStyle: 'circle' }}>Tập trung trễ từ 20 phút trở lên: Xử thua trận đó.</li>
                  <li style={{ listStyle: 'circle' }}>Các thành viên thi đấu không vào discord call (không có lí do chính đáng): Cảnh cáo.</li>
                  <li style={{ listStyle: 'circle' }}>Tự động bật freeze time (Technical Timeout) mà không có lí do: Cảnh cáo.</li>
                  <li style={{ listStyle: 'circle' }}>Trong quá trình thi đấu, nếu chat-all nói những lời không đẹp khiến đội bạn ức chế: Cảnh cáo. (Chụp bằng chứng và gửi về admin Beacon, Kero, IAMSnow, PN Vui hoặc Chanh)</li>
                  <p><i>Lưu ý: Cảnh cáo lần 3 sẽ tự động xử thua trận đó.</i></p>
                  <li style={{ listStyle: 'circle' }}>Các hành vi phi thể thao như "đánh thuê" cho team khác: Team hoặc cá nhân vi phạm bị LOẠI khỏi giải đấu !!!</li>
                </ul>
              </li>
              <li>
                <h4>16. Quy tắc xử thua</h4>
                <ul>
                  <li style={{ listStyle: 'circle' }}>Bỏ trận BO1: Xử thua 13-0</li>
                  <li style={{ listStyle: 'circle' }}>Bỏ trận BO3: Xử thua 2-0</li>
                  <li style={{ listStyle: 'circle' }}>Xử thua do bị cảnh cáo 3 lần trong giải đấu: Xử thua 13-x (x là số round thắng của team bị cảnh cáo 3 lần).</li>
                </ul>
              </li>
              <li>
                <h4>17. Lời kết</h4>
                <ul>
                  <li>Cám ơn các bạn đã đọc hết luật này. Tụi mình hi vọng các bạn sẽ tuân thủ những điều luật và tụi mình đã đề ra.</li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
    )
}