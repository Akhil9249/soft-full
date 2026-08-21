import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminService from "../../services/admin-api-service/AdminService";
import useAuth from "../../hooks/useAuth";
import logo from "../../assets/image/soft-log.png";

// Mocking lucide-react icons as per single-file requirement
const Eye = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>;
const EyeOff = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.585 10.587a2 2 0 0 0 2.828 2.828" /><path d="M16.681 16.684c-1.343.83-2.883 1.316-4.506 1.316-7 0-10-7-10-7a17.433 17.433 0 0 1 4.507-4.506" /><path d="M12 18c.571 0 1.127-.08 1.666-.23A25.967 25.967 0 0 0 20 12c-3.15-3.6-6.495-5-8-5-.36 0-.712.023-1.054.068" /><line x1="2" x2="22" y1="2" y2="22" /></svg>;
const Zap = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;




const Login = () => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    type: '', // 'success' or 'error'
    title: '',
    message: ''
  });
  // const [userData, setUserData] = useState();
  const { postLogin, postForgotPassword, postVerifyOtp, postResetPassword } = AdminService();
  const { setAuth } = useAuth();

  const navigate = useNavigate();

  // Forgot password state
  const [forgotPasswordStep, setForgotPasswordStep] = useState(""); // '', 'email', 'otp'
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpArray, setOtpArray] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    let intervalId;
    if (forgotPasswordStep === 'otp' && timer > 0) {
      intervalId = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [forgotPasswordStep, timer]);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Modal functions
  const showModal = (type, title, message) => {
    setModal({
      isOpen: true,
      type,
      title,
      message
    });

    // Auto-close success modal after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        closeModal();
      }, 3000);
    }
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      type: '',
      title: '',
      message: ''
    });
  };

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      setLoading(true);

      console.log("Logging in with:", { email, password });

      let userData = {
        email: email,
        password: password
      }
      const response = await postLogin(userData);
      console.log(response);

      if (response?.data?.success) {
        const accessToken = response?.data?.accessToken;
        const role = response?.data?.userData?.role;
        const id = response?.data?.userData?.id;
        const image = response?.data?.userData?.image || "";
        const name = response?.data?.userData?.name || "";
        const branch = response?.data?.userData?.branch || "";

        localStorage.setItem("accessToken", accessToken)
        localStorage.setItem("role", role)
        localStorage.setItem("userId", id) // Storing user ID
        localStorage.setItem("profileImage", image)
        localStorage.setItem("name", name)
        if (branch) {
          localStorage.setItem("branch", branch)
        }

        setAuth({ accessToken, role, id, image, name, branch })

        // Show success modal
        showModal('success', 'Login Successful!', `Welcome back, ${name}! Redirecting to your dashboard...`);

        // Navigate after a short delay to show the success message
        setTimeout(() => {
          const userRole = role?.toLowerCase() || '';
          if (userRole === 'super admin' || userRole === 'admin' || userRole === 'branch admin') {
            navigate("/dashboard");
          } else if (userRole === 'intern') {
            navigate("/student/attendance-dashboard");
          } else {
            navigate("/"); // Mentors and other roles go to root
          }
        }, 2000);
      } else {
        // Show error modal for failed login
        showModal('error', 'Login Failed', response?.data?.message || 'Invalid credentials. Please try again.');
      }

    } catch (error) {
      console.log(error);
      // Show error modal for network/server errors
      showModal('error', 'Login Error', error?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!resetEmail || !resetEmail.trim()) {
      showModal('error', 'Validation Error', 'Please enter your email address.');
      return;
    }
    try {
      setResetLoading(true);
      const response = await postForgotPassword({ email: resetEmail.trim() });
      if (response?.data?.success) {
        showModal('success', 'OTP Sent!', response.data.message);
        setTimer(30);
        setForgotPasswordStep('otp');
      } else {
        showModal('error', 'Failed to Send OTP', response?.data?.message || 'Failed to send OTP.');
      }
    } catch (err) {
      console.error(err);
      showModal('error', 'Error', err?.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue && value !== "") return;

    const newOtpArray = [...otpArray];
    newOtpArray[index] = cleanValue.substring(cleanValue.length - 1);
    setOtpArray(newOtpArray);
    setOtp(newOtpArray.join(''));

    // Auto-focus next input box if typed
    if (cleanValue && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpArray[index] && index > 0) {
        // Go back to previous block and erase it
        const prevInput = document.getElementById(`otp-${index - 1}`);
        prevInput?.focus();
        const newOtpArray = [...otpArray];
        newOtpArray[index - 1] = "";
        setOtpArray(newOtpArray);
        setOtp(newOtpArray.join(''));
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, 6);
    if (pastedData) {
      const newOtpArray = ["", "", "", "", "", ""];
      for (let i = 0; i < pastedData.length; i++) {
        newOtpArray[i] = pastedData[i];
      }
      setOtpArray(newOtpArray);
      setOtp(newOtpArray.join(''));
      
      // Auto-focus the last pasted box or next empty box
      const focusIndex = Math.min(pastedData.length, 5);
      const nextInput = document.getElementById(`otp-${focusIndex}`);
      nextInput?.focus();
    }
  };

  const handleResendOtp = async (e) => {
    e.preventDefault();
    try {
      setResetLoading(true);
      const response = await postForgotPassword({ email: resetEmail.trim() });
      if (response?.data?.success) {
        showModal('success', 'OTP Resent!', response.data.message);
        setTimer(30);
        setOtp('');
        setOtpArray(["", "", "", "", "", ""]);
      } else {
        showModal('error', 'Failed to Send OTP', response?.data?.message || 'Failed to send OTP.');
      }
    } catch (err) {
      console.error(err);
      showModal('error', 'Error', err?.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      showModal('error', 'Validation Error', 'Please enter the 6-digit OTP code.');
      return;
    }
    try {
      setResetLoading(true);
      const response = await postVerifyOtp({
        email: resetEmail.trim(),
        otp: otp.trim()
      });
      if (response?.data?.success) {
        showModal('success', 'OTP Verified!', response.data.message);
        setForgotPasswordStep('password');
      } else {
        showModal('error', 'Verification Failed', response?.data?.message || 'Invalid OTP.');
      }
    } catch (err) {
      console.error(err);
      showModal('error', 'Error', err?.response?.data?.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      showModal('error', 'Validation Error', 'Please enter the 6-digit OTP code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      showModal('error', 'Validation Error', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showModal('error', 'Validation Error', 'Passwords do not match.');
      return;
    }
    try {
      setResetLoading(true);
      const response = await postResetPassword({
        email: resetEmail.trim(),
        otp: otp.trim(),
        password: newPassword
      });
      if (response?.data?.success) {
        showModal('success', 'Success', response.data.message);
        setForgotPasswordStep('');
        setResetEmail('');
        setOtp('');
        setOtpArray(["", "", "", "", "", ""]);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showModal('error', 'Reset Failed', response?.data?.message || 'Failed to reset password.');
      }
    } catch (err) {
      console.error(err);
      showModal('error', 'Error', err?.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  // Define the custom button color to match the image precisely
  const customOrange = "bg-[#E99732]";
  const customOrangeHover = "hover:bg-[#d98a2e]";


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <style>{`
        /* Load Inter font */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        * { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Logo Section */}
      <div className="flex items-center justify-center mb-8 select-none">
        <img
          src={logo}
          alt="Softroniics Logo"
          className="h-16 w-auto object-contain"
        />
      </div>

      {/* Login Card (Responsive max-width) */}
      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-xl shadow-2xl">
        {forgotPasswordStep === "" ? (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Welcome Back!
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* E-Mail Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  E-Mail
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your Mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition duration-150 ease-in-out placeholder:text-gray-400 disabled:opacity-75"
                />
              </div>

              {/* Password Field */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition duration-150 ease-in-out pr-12 placeholder:text-gray-400 disabled:opacity-75"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition duration-150 ease-in-out disabled:cursor-not-allowed"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={loading}
                  >
                    {/* The "link" style icon in the image is often used for password visibility toggle */}
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setForgotPasswordStep('email')}
                  className="text-xs font-semibold text-orange-500 hover:text-orange-600 focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Log In Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full text-white font-semibold py-3 rounded-lg ${customOrange} ${customOrangeHover} focus:outline-none focus:ring-4 focus:ring-amber-500 focus:ring-opacity-50 transition duration-150 ease-in-out shadow-lg disabled:opacity-70 disabled:cursor-wait mt-8`}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Logging In...</span>
                  </div>
                ) : (
                  'Log In'
                )}
              </button>
            </form>
          </>
        ) : forgotPasswordStep === "email" ? (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Reset Password
            </h2>
            <p className="text-sm text-gray-600 mb-8">
              Enter your email address and we'll send you an OTP to reset your password.
            </p>

            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-semibold text-gray-700 mb-2">
                  E-Mail Address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your registered Mail"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  disabled={resetLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition duration-150 ease-in-out placeholder:text-gray-400 disabled:opacity-75"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordStep('');
                    setResetEmail('');
                  }}
                  disabled={resetLoading}
                  className="w-full sm:w-1/2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg focus:outline-none transition duration-150 ease-in-out"
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className={`w-full sm:w-1/2 text-white font-semibold py-3 rounded-lg ${customOrange} ${customOrangeHover} focus:outline-none transition duration-150 ease-in-out disabled:opacity-70`}
                >
                  {resetLoading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            </form>
          </>
        ) : forgotPasswordStep === "otp" ? (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Verify OTP
            </h2>
            <p className="text-sm text-gray-600 mb-8">
              We've sent a 6-digit OTP code to <strong>{resetEmail}</strong>.
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
                  6-Digit OTP
                </label>
                <div className="flex justify-between gap-2 max-w-[280px] mx-auto mb-4">
                  {otpArray.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      disabled={resetLoading || timer === 0}
                      required
                      className="w-10 h-12 text-center text-xl font-bold border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition duration-150 ease-in-out disabled:opacity-75"
                    />
                  ))}
                </div>
                {timer === 0 ? (
                  <div className="text-center text-red-500 text-xs font-semibold mt-2 mb-4">
                    OTP Expired. Please resend a new OTP.
                  </div>
                ) : (
                  <div className="text-center text-gray-500 text-xs font-semibold mt-2 mb-4">
                    OTP expires in {timer} seconds.
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {timer === 0 ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resetLoading}
                    className={`w-full text-white font-semibold py-3 rounded-lg ${customOrange} ${customOrangeHover} focus:outline-none transition duration-150 ease-in-out disabled:opacity-70`}
                  >
                    {resetLoading ? 'Resending...' : 'Resend OTP'}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className={`w-full text-white font-semibold py-3 rounded-lg ${customOrange} ${customOrangeHover} focus:outline-none transition duration-150 ease-in-out disabled:opacity-70`}
                  >
                    {resetLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordStep('email');
                    setOtp('');
                    setOtpArray(["", "", "", "", "", ""]);
                  }}
                  disabled={resetLoading}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg focus:outline-none transition duration-150 ease-in-out"
                >
                  Back
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose New Password
            </h2>
            <p className="text-sm text-gray-600 mb-8">
              Please enter your new secure password below.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label htmlFor="new-password" className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={resetLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition duration-150 ease-in-out pr-12 placeholder:text-gray-400 disabled:opacity-75"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    disabled={resetLoading}
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={resetLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition duration-150 ease-in-out pr-12 placeholder:text-gray-400 disabled:opacity-75"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    disabled={resetLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={resetLoading}
                  className={`w-full text-white font-semibold py-3 rounded-lg ${customOrange} ${customOrangeHover} focus:outline-none transition duration-150 ease-in-out disabled:opacity-70`}
                >
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Version Number */}
      <p className="mt-8 text-sm text-gray-500 select-none">
        Ver 22.23.11
      </p>

      {/* Success/Error Modal */}
      {modal.isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`px-6 py-4 rounded-t-xl ${modal.type === 'success' ? 'bg-green-50' : 'bg-red-50'
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${modal.type === 'success' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                    {modal.type === 'success' ? (
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className={`text-lg font-semibold ${modal.type === 'success' ? 'text-green-800' : 'text-red-800'
                      }`}>
                      {modal.title}
                    </h3>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={closeModal}
                  className={`p-1 rounded-full hover:bg-opacity-20 transition-colors duration-200 ${modal.type === 'success' ? 'hover:bg-green-200 text-green-600' : 'hover:bg-red-200 text-red-600'
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4">
              <p className={`text-sm ${modal.type === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                {modal.message}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl">
              <div className="flex justify-end">
                <button
                  onClick={closeModal}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${modal.type === 'success'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                >
                  {modal.type === 'success' ? 'Continue' : 'Try Again'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
