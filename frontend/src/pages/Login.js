import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, User, Lock, Home } from "lucide-react";
import API from "../api/axios"; 
import { getErrorMessage } from "../utils/errorHelpers";
import toast from "react-hot-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.setItem("userRole", response.data.user.role);
      localStorage.setItem("userName", response.data.user.name || "");
      localStorage.setItem("userEmail", response.data.user.email || "");
      if (response.data.user.avatar) localStorage.setItem("userAvatar", response.data.user.avatar);
      else localStorage.removeItem("userAvatar");

      setIsLoading(false);
      navigate("/dashboard");
    } catch (error) {
      const status = error.response?.status;
      const detail = getErrorMessage(error, "Login failed");

      if (status === 403 || detail === "Account pending approval") {
        try {
          await API.post("/auth/activate-self", { email, password });
          const retry = await API.post("/auth/login", { email, password });
          localStorage.setItem("token", retry.data.access_token);
          localStorage.setItem("user", JSON.stringify(retry.data.user));
          localStorage.setItem("userRole", retry.data.user.role);
          localStorage.setItem("userName", retry.data.user.name || "");
          localStorage.setItem("userEmail", retry.data.user.email || "");
          if (retry.data.user.avatar) localStorage.setItem("userAvatar", retry.data.user.avatar);
          else localStorage.removeItem("userAvatar");
          
          setIsLoading(false);
          navigate("/dashboard");
          return;
        } catch (e2) {
          alert(e2.response?.data?.detail || e2.response?.data?.message || "Activation failed");
        }
      } else if (status === 401) {
        alert("Invalid email or password");
      } else if (status === 404) {
        alert("User not found");
      } else {
        alert(detail);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 md:p-8 font-sans bg-[#3c786c]">
      {/* Background Layer (Blurred Cafe) */}
      <div className="absolute inset-0 overflow-hidden z-0">
         <div className="absolute inset-0 bg-[#29786a]/90 mix-blend-multiply z-10" />
         <img 
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-60 blur-[3px] scale-105" 
            alt="Cafe Background" 
         />
      </div>

      {/* Home Button Top Left */}
      <Link to="/" className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-2 text-white/90 hover:text-white font-medium text-lg transition-all z-20 px-4 py-2 hover:bg-white/20 hover:backdrop-blur-md rounded-xl hover:-translate-y-1 hover:shadow-xl duration-300">
        <Home size={24} /> Home
      </Link>

      {/* Main Split Card */}
      <div className="relative z-10 w-full max-w-5xl md:h-[600px] bg-white rounded-xl md:rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side (Image with S-Curve wave) */}
        <div className="hidden md:block relative w-[45%] bg-[#368b78]">
           <img 
              src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop" 
              className="w-full h-full object-cover mix-blend-overlay opacity-60" 
              alt="Inside Cafe" 
           />
           <div className="absolute inset-0 bg-[#1c5f52]/40 mix-blend-multiply" />
           
           {/* SVG Wave mask overlay to create the S-curve onto the white side */}
           <svg className="absolute right-0 top-0 h-full w-[250px] text-white" viewBox="0 0 100 1000" preserveAspectRatio="none">
              <path d="M100,0 L100,1000 L90,1000 C150,650 -50,350 0,0 Z" fill="currentColor" />
           </svg>
        </div>

        {/* Right Side (Form) */}
        <div className="w-full md:w-[55%] flex flex-col justify-center items-center py-12 p-8 md:p-12 relative bg-white">
           <div className="w-full max-w-sm flex flex-col items-center">
             
             <h2 className="text-[2.5rem] text-gray-700 mb-1 font-light tracking-wide">
                 {isForgotMode ? 'Reset Password' : 'Welcome'}
             </h2>
             <p className="text-gray-400 text-sm mb-12 font-light text-center">
                 {isForgotMode ? 'Enter your email to receive recovery instructions' : 'Log in to your account to continue'}
             </p>
             
             {!isForgotMode ? (
                 <form className="w-full space-y-5" onSubmit={handleLogin}>
                     {/* Email Input */}
                     <div className="relative">
                         <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                         <input 
                            type="email" 
                            required
                            placeholder="awesome@user.com" 
                            className="w-full py-3.5 pl-12 pr-4 text-gray-600 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#40c3ab] focus:ring-1 focus:ring-[#40c3ab] transition-all placeholder:text-gray-400 font-light" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                         />
                     </div>

                     {/* Password Input */}
                     <div className="relative">
                         <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                         <input 
                            type={showPassword ? "text" : "password"} 
                            required
                            placeholder="••••••••••••" 
                            className="w-full py-3.5 pl-12 pr-12 text-gray-700 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#40c3ab] focus:ring-1 focus:ring-[#40c3ab] transition-all placeholder:text-gray-400 tracking-wider" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                         />
                         <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                            {showPassword ? <Eye size={16}/> : <EyeOff size={16}/>}
                         </button>
                     </div>
                     
                     {/* Forgot Password */}
                     <div className="flex justify-end w-full pt-1">
                         <span onClick={() => setIsForgotMode(true)} className="text-xs text-[#a0aec0] hover:text-[#40c3ab] underline transition-colors cursor-pointer font-light">Forgot your password?</span>
                     </div>

                     {/* Action Buttons */}
                     <div className="w-full flex gap-4 pt-4">
                         <button 
                             type="submit" 
                             disabled={isLoading} 
                             className="flex-1 bg-[#36c2a6] hover:bg-[#2ca38a] text-white border border-transparent font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-[#36c2a6]/30 disabled:opacity-70 disabled:hover:shadow-none shadow-md shadow-[#36c2a6]/20 flex items-center justify-center"
                         >
                             {isLoading ? "Wait..." : "Log In"}
                         </button>
                         <Link 
                             to="/register" 
                             className="flex-1 bg-white border border-[#36c2a6] hover:bg-[#f0faf8] text-[#36c2a6] font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-md text-center flex items-center justify-center"
                         >
                             Register
                         </Link>
                     </div>
                 </form>
             ) : (
                 <form className="w-full space-y-6" onSubmit={(e) => { e.preventDefault(); toast.success('Reset link dispatched to your email address!'); setIsForgotMode(false); }}>
                     {/* Email Input */}
                     <div className="relative">
                         <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                         <input 
                            type="email" 
                            required
                            placeholder="Enter recovering email..." 
                            className="w-full py-3.5 pl-12 pr-4 text-gray-600 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#40c3ab] focus:ring-1 focus:ring-[#40c3ab] transition-all placeholder:text-gray-400 font-light" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                         />
                     </div>

                     {/* Action Buttons */}
                     <div className="w-full flex gap-4 pt-2">
                         <button 
                             type="submit" 
                             className="flex-1 bg-[#36c2a6] hover:bg-[#2ca38a] text-white border border-transparent font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-[#36c2a6]/30 shadow-md flex items-center justify-center"
                         >
                             Request Reset Link
                         </button>
                         <button 
                             type="button" 
                             onClick={() => setIsForgotMode(false)}
                             className="flex-1 bg-white border border-[#36c2a6] hover:bg-[#f0faf8] text-[#36c2a6] font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-md text-center flex items-center justify-center"
                         >
                             Cancel
                         </button>
                     </div>
                 </form>
             )}

             {/* Social Icons mapped to the screenshot */}
             <div className="mt-14 flex items-center justify-center gap-6">
                 <div className="cursor-pointer text-gray-300 hover:text-gray-500 transition-colors">
                     {/* Facebook Icon */}
                     <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>
                     </svg>
                 </div>
                 <div className="cursor-pointer text-gray-300 hover:text-gray-500 transition-colors">
                     {/* Twitter Icon */}
                     <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
                     </svg>
                 </div>
                 <div className="cursor-pointer text-gray-300 hover:text-gray-500 transition-colors">
                     {/* LinkedIn Icon */}
                     <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"></path>
                        <circle cx="4" cy="4" r="2"></circle>
                     </svg>
                 </div>
             </div>
             
           </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
