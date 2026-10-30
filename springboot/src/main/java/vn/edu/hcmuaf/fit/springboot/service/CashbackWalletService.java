package vn.edu.hcmuaf.fit.springboot.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.hcmuaf.fit.springboot.dto.WalletResponseDTO;
import vn.edu.hcmuaf.fit.springboot.model.Booking;
import vn.edu.hcmuaf.fit.springboot.model.Homestay;
import vn.edu.hcmuaf.fit.springboot.model.UserWallet;
import vn.edu.hcmuaf.fit.springboot.model.WalletTransaction;
import vn.edu.hcmuaf.fit.springboot.repository.BookingRepository;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayRepository;
import vn.edu.hcmuaf.fit.springboot.repository.UserWalletRepository;
import vn.edu.hcmuaf.fit.springboot.repository.WalletTransactionRepository;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class CashbackWalletService {

    private final UserWalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final BookingRepository bookingRepository;
    private final HomestayRepository homestayRepository;
    private final NotificationService notificationService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DecimalFormat VND_FORMAT;

    static {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.GERMANY);
        symbols.setGroupingSeparator('.');
        symbols.setDecimalSeparator(',');
        VND_FORMAT = new DecimalFormat("#,##0", symbols);
    }

    private String formatVnd(BigDecimal amount) {
        if (amount == null) return "0";
        return VND_FORMAT.format(amount);
    }

    /**
     * Lấy thông tin ví và lịch sử biến động số dư cực nhanh (tối ưu query)
     */
    @Transactional
    public WalletResponseDTO getWalletInfo(Long userId) {
        UserWallet wallet = walletRepository.findByUserId(userId).orElse(null);

        if (wallet == null) {
            wallet = initializeUserWallet(userId);
        }

        List<WalletTransaction> transactions = transactionRepository.findTop30ByUserIdOrderByCreatedAtDesc(userId);

        return toWalletResponseDTO(wallet, transactions);
    }

    /**
     * Tự động khởi tạo ví từ dữ liệu booking thực tế của User trong CSDL Neon
     */
    private UserWallet initializeUserWallet(Long userId) {
        log.info("Khởi tạo ví mới cho user: {}", userId);

        List<Booking> userBookings = bookingRepository.findByTouristId(userId);

        BigDecimal totalCashback = BigDecimal.ZERO;
        List<WalletTransaction> initialTxns = new ArrayList<>();

        if (userBookings != null && !userBookings.isEmpty()) {
            for (Booking b : userBookings) {
                if (b.getTotalPrice() != null && b.getTotalPrice().compareTo(BigDecimal.ZERO) > 0) {
                    // 5% cashback cho mỗi booking
                    BigDecimal cashbackAmount = b.getTotalPrice().multiply(BigDecimal.valueOf(0.05));
                    totalCashback = totalCashback.add(cashbackAmount);

                    String homestayName = "Homestay YÊN";
                    if (b.getHomestayId() != null) {
                        Homestay h = homestayRepository.findById(b.getHomestayId()).orElse(null);
                        if (h != null && h.getName() != null) {
                            homestayName = h.getName();
                        }
                    }

                    String dateStr = (b.getCreatedAt() != null ? b.getCreatedAt().format(DATE_FORMATTER) : LocalDateTime.now().format(DATE_FORMATTER))
                            + " • " + homestayName;

                    WalletTransaction txn = WalletTransaction.builder()
                            .userId(userId)
                            .title("Hoàn tiền 5% đơn đặt phòng #" + (b.getBookingCode() != null ? b.getBookingCode() : "HS-" + b.getId()))
                            .dateDisplay(dateStr)
                            .amount(cashbackAmount)
                            .amountDisplay("+" + formatVnd(cashbackAmount) + " VNĐ")
                            .type("plus")
                            .status("Thành công")
                            .referenceCode(b.getBookingCode())
                            .createdAt(b.getCreatedAt() != null ? b.getCreatedAt() : LocalDateTime.now())
                            .build();

                    initialTxns.add(txn);
                }
            }
        }

        BigDecimal balance = totalCashback;

        UserWallet wallet = UserWallet.builder()
                .userId(userId)
                .balance(balance)
                .totalCashback(totalCashback)
                .cashbackRate(BigDecimal.valueOf(5.0))
                .updatedAt(LocalDateTime.now())
                .build();

        wallet = walletRepository.save(wallet);

        for (WalletTransaction t : initialTxns) {
            transactionRepository.save(t);
        }

        return wallet;
    }

    private WalletResponseDTO toWalletResponseDTO(UserWallet wallet, List<WalletTransaction> txns) {
        List<WalletResponseDTO.WalletTransactionDTO> txnDTOs = txns.stream()
                .filter(t -> t.getTitle() == null || (!t.getTitle().toLowerCase(Locale.ROOT).contains("rút tiền")
                        && !t.getTitle().toLowerCase(Locale.ROOT).contains("ngân hàng")))
                .map(t -> WalletResponseDTO.WalletTransactionDTO.builder()
                        .id(t.getId())
                        .title(t.getTitle())
                        .date(t.getDateDisplay())
                        .amount(t.getAmountDisplay() != null ? t.getAmountDisplay() : formatVnd(t.getAmount()) + " VNĐ")
                        .rawAmount(t.getAmount())
                        .type(t.getType())
                        .status(t.getStatus())
                        .referenceCode(t.getReferenceCode())
                        .build())
                .collect(Collectors.toList());

        return WalletResponseDTO.builder()
                .walletId(wallet.getId())
                .userId(wallet.getUserId())
                .balance(wallet.getBalance())
                .totalCashback(wallet.getTotalCashback())
                .cashbackRate(wallet.getCashbackRate())
                .transactions(txnDTOs)
                .build();
    }

    /**
     * Tự động tích lũy 5% hoàn tiền / điểm thưởng cho du khách khi đặt phòng thành công
     */
    @Transactional
    public void creditCashbackForBooking(Booking booking) {
        if (booking == null || booking.getTouristId() == null) {
            return;
        }

        BigDecimal totalPrice = booking.getTotalPrice();
        if (totalPrice == null || totalPrice.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        // Tỷ lệ hoàn tiền mặc định: 5%
        BigDecimal rate = BigDecimal.valueOf(0.05);
        BigDecimal cashback = totalPrice.multiply(rate).setScale(0, java.math.RoundingMode.HALF_UP);
        if (cashback.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        String bookingCode = booking.getBookingCode() != null ? booking.getBookingCode() : ("YEN-" + booking.getId());

        // Kiểm tra xem đơn này đã được tích điểm chưa (Idempotency - tránh cộng trùng lặp)
        List<WalletTransaction> existing = transactionRepository.findByUserIdOrderByCreatedAtDesc(booking.getTouristId());
        boolean alreadyCredited = existing.stream()
                .anyMatch(t -> bookingCode.equals(t.getReferenceCode()) && "plus".equalsIgnoreCase(t.getType()));
        if (alreadyCredited) {
            log.info("Đơn đặt phòng {} đã được tích điểm trước đó, bỏ qua.", bookingCode);
            return;
        }

        // Lấy hoặc tự động khởi tạo ví cho du khách
        UserWallet wallet = walletRepository.findByUserId(booking.getTouristId())
                .orElseGet(() -> initializeUserWallet(booking.getTouristId()));

        BigDecimal curBalance = wallet.getBalance() != null ? wallet.getBalance() : BigDecimal.ZERO;
        BigDecimal curTotal = wallet.getTotalCashback() != null ? wallet.getTotalCashback() : BigDecimal.ZERO;

        wallet.setBalance(curBalance.add(cashback));
        wallet.setTotalCashback(curTotal.add(cashback));
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);

        String homestayName = "Homestay YÊN";
        if (booking.getHomestayId() != null) {
            homestayName = homestayRepository.findById(booking.getHomestayId())
                    .map(Homestay::getName).orElse("Homestay YÊN");
        }

        String dateStr = LocalDateTime.now().format(DATE_FORMATTER) + " • " + homestayName;

        WalletTransaction txn = WalletTransaction.builder()
                .userId(booking.getTouristId())
                .title("Tích lũy 5% đơn đặt phòng #" + bookingCode)
                .dateDisplay(dateStr)
                .amount(cashback)
                .amountDisplay("+" + formatVnd(cashback) + " VNĐ")
                .type("plus")
                .status("Thành công")
                .referenceCode(bookingCode)
                .createdAt(LocalDateTime.now())
                .build();

        transactionRepository.save(txn);
        log.info("Đã tự động tích lũy {} VNĐ cho du khách {} từ đơn đặt phòng {}", cashback, booking.getTouristId(), bookingCode);

        // Gửi thông báo trực tiếp đến du khách
        try {
            notificationService.create(
                    booking.getTouristId(),
                    "Tích điểm Ví YÊN thành công! (+" + formatVnd(cashback) + "đ)",
                    "Bạn vừa nhận được " + formatVnd(cashback) + "đ vào Ví hoàn tiền từ đơn đặt phòng #" + bookingCode + " tại " + homestayName + ".",
                    "CASHBACK",
                    booking.getId(),
                    "/personal-account"
            );
        } catch (Exception e) {
            log.warn("Không thể gửi thông báo tích điểm: {}", e.getMessage());
        }
    }

    /**
     * Khấu trừ điểm / tiền tích lũy khi du khách dùng để thanh toán đơn đặt phòng
     */
    @Transactional
    public void deductCashbackForBooking(Long userId, BigDecimal amount, String bookingCode) {
        if (userId == null || amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        UserWallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> initializeUserWallet(userId));
        if (wallet == null || wallet.getBalance() == null || wallet.getBalance().compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        BigDecimal deductAmount = amount.min(wallet.getBalance()).setScale(0, java.math.RoundingMode.HALF_UP);
        if (deductAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        wallet.setBalance(wallet.getBalance().subtract(deductAmount));
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);

        String dateStr = LocalDateTime.now().format(DATE_FORMATTER) + " • Đơn phòng #" + bookingCode;

        WalletTransaction txn = WalletTransaction.builder()
                .userId(userId)
                .title("Dùng điểm tích lũy thanh toán đơn #" + bookingCode)
                .dateDisplay(dateStr)
                .amount(deductAmount)
                .amountDisplay("-" + formatVnd(deductAmount) + " VNĐ")
                .type("minus")
                .status("Thành công")
                .referenceCode(bookingCode)
                .createdAt(LocalDateTime.now())
                .build();

        transactionRepository.save(txn);
        log.info("Đã trừ {} VNĐ điểm tích lũy của du khách {} cho đơn {}", deductAmount, userId, bookingCode);
    }
}
