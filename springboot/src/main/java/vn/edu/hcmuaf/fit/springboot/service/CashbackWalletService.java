package vn.edu.hcmuaf.fit.springboot.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.hcmuaf.fit.springboot.dto.UpdateBankRequestDTO;
import vn.edu.hcmuaf.fit.springboot.dto.UpdatePinRequestDTO;
import vn.edu.hcmuaf.fit.springboot.dto.WalletResponseDTO;
import vn.edu.hcmuaf.fit.springboot.dto.WithdrawRequestDTO;
import vn.edu.hcmuaf.fit.springboot.model.Booking;
import vn.edu.hcmuaf.fit.springboot.model.Homestay;
import vn.edu.hcmuaf.fit.springboot.model.User;
import vn.edu.hcmuaf.fit.springboot.model.UserWallet;
import vn.edu.hcmuaf.fit.springboot.model.WalletTransaction;
import vn.edu.hcmuaf.fit.springboot.repository.BookingRepository;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayRepository;
import vn.edu.hcmuaf.fit.springboot.repository.UserRepository;
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
    private final UserRepository userRepository;

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
        Optional<User> userOpt = userRepository.findById(userId);
        String accountHolder = userOpt.map(User::getFullName).filter(n -> !n.trim().isEmpty()).orElse("Lê Hoàng Mai Chi");

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

        // Nếu tổng tiền hoàn chưa đạt mức tối thiểu hoặc user chưa có booking, bổ sung các giao dịch mặc định mẫu
        if (totalCashback.compareTo(BigDecimal.valueOf(200000)) < 0) {
            BigDecimal bonus1 = BigDecimal.valueOf(65000);
            BigDecimal bonus2 = BigDecimal.valueOf(72500);
            BigDecimal defaultWithdraw = BigDecimal.valueOf(200000);

            WalletTransaction t1 = WalletTransaction.builder()
                    .userId(userId)
                    .title("Hoàn tiền 5% đơn đặt phòng #HS-98234")
                    .dateDisplay("12/08/2026 10:15 • Pù Luông Eco Garden Homestay")
                    .amount(bonus1)
                    .amountDisplay("+65.000 VNĐ")
                    .type("plus")
                    .status("Thành công")
                    .referenceCode("HS-98234")
                    .createdAt(LocalDateTime.now().minusDays(15))
                    .build();

            WalletTransaction t2 = WalletTransaction.builder()
                    .userId(userId)
                    .title("Hoàn tiền 5% đơn đặt phòng #HS-87112")
                    .dateDisplay("24/05/2026 16:40 • The Memory Valley Villa Đà Lạt")
                    .amount(bonus2)
                    .amountDisplay("+72.500 VNĐ")
                    .type("plus")
                    .status("Thành công")
                    .referenceCode("HS-87112")
                    .createdAt(LocalDateTime.now().minusDays(30))
                    .build();

            WalletTransaction t3 = WalletTransaction.builder()
                    .userId(userId)
                    .title("Rút tiền số dư về ngân hàng Vietcombank")
                    .dateDisplay("01/05/2026 09:30 • Mã giao dịch VCB991203")
                    .amount(defaultWithdraw)
                    .amountDisplay("-200.000 VNĐ")
                    .type("minus")
                    .status("Đã chuyển khoản")
                    .referenceCode("VCB991203")
                    .createdAt(LocalDateTime.now().minusDays(45))
                    .build();

            initialTxns.add(t1);
            initialTxns.add(t2);
            initialTxns.add(t3);
            totalCashback = totalCashback.add(bonus1).add(bonus2).add(BigDecimal.valueOf(1112500));
        }

        BigDecimal balance = totalCashback.compareTo(BigDecimal.valueOf(350000)) >= 0
                ? BigDecimal.valueOf(350000)
                : totalCashback;

        UserWallet wallet = UserWallet.builder()
                .userId(userId)
                .balance(balance)
                .totalCashback(totalCashback.compareTo(BigDecimal.ZERO) > 0 ? totalCashback : BigDecimal.valueOf(1250000))
                .cashbackRate(BigDecimal.valueOf(5.0))
                .bankName("Vietcombank")
                .accountNumber("•••• 6868")
                .accountHolder(accountHolder)
                .isLinked(true)
                .walletPin("123456")
                .isPinSet(true)
                .updatedAt(LocalDateTime.now())
                .build();

        wallet = walletRepository.save(wallet);

        for (WalletTransaction t : initialTxns) {
            transactionRepository.save(t);
        }

        return wallet;
    }

    /**
     * Rút tiền số dư về tài khoản ngân hàng
     */
    @Transactional
    public WalletResponseDTO withdraw(Long userId, WithdrawRequestDTO request) {
        UserWallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> initializeUserWallet(userId));

        BigDecimal amt = request.getAmount();
        if (amt == null || amt.compareTo(BigDecimal.valueOf(50000)) < 0) {
            throw new IllegalArgumentException("Số tiền rút tối thiểu là 50.000 VNĐ");
        }

        if (wallet.getBalance() == null || wallet.getBalance().compareTo(amt) < 0) {
            throw new IllegalArgumentException("Số dư khả dụng không đủ để thực hiện rút tiền! (Số dư hiện tại: "
                    + formatVnd(wallet.getBalance()) + " VNĐ)");
        }

        // Trừ số dư
        wallet.setBalance(wallet.getBalance().subtract(amt));
        walletRepository.save(wallet);

        String bankName = (request.getBank() != null && !request.getBank().trim().isEmpty())
                ? request.getBank().trim()
                : wallet.getBankName();

        String accNum = (request.getAccNum() != null && !request.getAccNum().trim().isEmpty())
                ? request.getAccNum().trim()
                : wallet.getAccountNumber();

        String traceCode = "VCB-" + (System.currentTimeMillis() % 1000000);

        WalletTransaction txn = WalletTransaction.builder()
                .userId(userId)
                .title("Rút tiền về ngân hàng " + bankName)
                .dateDisplay(LocalDateTime.now().format(DATE_FORMATTER) + " • STK: " + accNum)
                .amount(amt)
                .amountDisplay("-" + formatVnd(amt) + " VNĐ")
                .type("minus")
                .status("Đang xử lý")
                .referenceCode(traceCode)
                .createdAt(LocalDateTime.now())
                .build();

        transactionRepository.save(txn);
        log.info("Rút tiền thành công: user={}, amount={}, bank={}, accNum={}", userId, amt, bankName, accNum);

        List<WalletTransaction> transactions = transactionRepository.findTop30ByUserIdOrderByCreatedAtDesc(userId);
        return toWalletResponseDTO(wallet, transactions);
    }

    /**
     * Cập nhật thông tin ngân hàng liên kết
     */
    @Transactional
    public WalletResponseDTO updateBank(Long userId, UpdateBankRequestDTO request) {
        UserWallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> initializeUserWallet(userId));

        if (request.getBankName() != null && !request.getBankName().trim().isEmpty()) {
            wallet.setBankName(request.getBankName().trim());
        }
        if (request.getAccountNumber() != null && !request.getAccountNumber().trim().isEmpty()) {
            wallet.setAccountNumber(request.getAccountNumber().trim());
        }
        if (request.getAccountHolder() != null && !request.getAccountHolder().trim().isEmpty()) {
            wallet.setAccountHolder(request.getAccountHolder().trim());
        }
        wallet.setIsLinked(true);

        walletRepository.save(wallet);
        List<WalletTransaction> transactions = transactionRepository.findTop30ByUserIdOrderByCreatedAtDesc(userId);
        return toWalletResponseDTO(wallet, transactions);
    }

    /**
     * Cập nhật mã PIN ví 6 chữ số
     */
    @Transactional
    public WalletResponseDTO updatePin(Long userId, UpdatePinRequestDTO request) {
        UserWallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> initializeUserWallet(userId));

        if (request.getNewPin() == null || request.getNewPin().length() != 6) {
            throw new IllegalArgumentException("Mã PIN phải bao gồm đúng 6 chữ số!");
        }

        wallet.setWalletPin(request.getNewPin().trim());
        wallet.setIsPinSet(true);

        walletRepository.save(wallet);
        List<WalletTransaction> transactions = transactionRepository.findTop30ByUserIdOrderByCreatedAtDesc(userId);
        return toWalletResponseDTO(wallet, transactions);
    }

    private WalletResponseDTO toWalletResponseDTO(UserWallet wallet, List<WalletTransaction> txns) {
        List<WalletResponseDTO.WalletTransactionDTO> txnDTOs = txns.stream()
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
                .bankName(wallet.getBankName())
                .accountNumber(wallet.getAccountNumber())
                .accountHolder(wallet.getAccountHolder())
                .isLinked(wallet.getIsLinked())
                .isPinSet(wallet.getIsPinSet())
                .transactions(txnDTOs)
                .build();
    }
}
