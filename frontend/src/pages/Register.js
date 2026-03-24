import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, User, Lock, Home } from "lucide-react";
import API from "../api/axios";
import { getErrorMessage } from "../utils/errorHelpers";
import toast from "react-hot-toast";

const Register = () => {
  const [role, setRole] = useState("student");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = role === "student" ? "/auth/register/student" : "/auth/register/faculty";
      await API.post(endpoint, {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        password: formData.password
      });

      toast.success("Registration successful! Account pending approval.");
      navigate("/login");
    } catch (err) {
      toast.error(getErrorMessage(err, "Registration failed. Please try again."));
    } finally {
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
      <div className="relative z-10 w-full max-w-5xl md:h-[650px] bg-white rounded-xl md:rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden">
        
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
        <div className="w-full md:w-[55%] flex flex-col justify-center items-center py-10 p-8 md:px-12 relative bg-white overflow-y-auto custom-scrollbar">
           <div className="w-full max-w-md flex flex-col items-center flex-1 justify-center">
             
             <h2 className="text-4xl text-gray-800 mb-6 font-black tracking-tight">Sign Up</h2>
             
             {/* Tabs */}
             <div className="flex w-full mb-6 gap-3">
                <button 
                  type="button" 
                  onClick={() => setRole("student")} 
                  className={`flex-1 py-3 text-[10px] sm:text-xs font-black tracking-widest uppercase transition-all rounded-lg border-2 ${role === 'student' ? 'border-[#36c2a6] text-[#36c2a6] bg-[#f0faf8]' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                >
                  STUDENT
                </button>
                <button 
                  type="button" 
                  onClick={() => setRole("faculty")} 
                  className={`flex-1 py-3 text-[10px] sm:text-xs font-black tracking-widest uppercase transition-all rounded-lg border-2 ${role === 'faculty' ? 'border-gray-800 text-gray-800 bg-gray-50' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                >
                  FACULTY
                </button>
             </div>
             
             <form className="w-full space-y-4" onSubmit={handleSubmit}>
                 
                 {/* First Name & Last Name */}
                 <div className="flex flex-col sm:flex-row gap-4">
                     <div className="relative flex-1">
                         <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                         <input 
                            name="firstName" 
                            type="text" 
                            required
                            placeholder="Enter First Name" 
                            className="w-full py-3.5 pl-11 pr-4 text-gray-600 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#36c2a6] focus:ring-1 focus:ring-[#36c2a6] transition-all placeholder:text-gray-400 font-light" 
                            value={formData.firstName} 
                            onChange={handleInputChange} 
                         />
                     </div>
                     <div className="relative flex-1">
                         <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                         <input 
                            name="lastName" 
                            type="text" 
                            required
                            placeholder="Enter Last Name" 
                            className="w-full py-3.5 pl-11 pr-4 text-gray-600 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#36c2a6] focus:ring-1 focus:ring-[#36c2a6] transition-all placeholder:text-gray-400 font-light" 
                            value={formData.lastName} 
                            onChange={handleInputChange} 
                         />
                     </div>
                 </div>

                 {/* Email Input */}
                 <div className="relative">
                     <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                     <input 
                        type="email" 
                        name="email"
                        required
                        placeholder="Enter Email (e.g. anakha@gmail.com)" 
                        className="w-full py-3.5 pl-12 pr-4 text-gray-600 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#36c2a6] focus:ring-1 focus:ring-[#36c2a6] transition-all placeholder:text-gray-400 font-light" 
                        value={formData.email} 
                        onChange={handleInputChange} 
                     />
                 </div>

                 {/* Password Input */}
                 <div className="relative">
                     <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                     <input 
                        type={showPassword ? "text" : "password"} 
                        name="password"
                        required
                        placeholder="••••••••" 
                        className="w-full py-3.5 pl-12 pr-12 text-gray-700 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#36c2a6] focus:ring-1 focus:ring-[#36c2a6] transition-all placeholder:text-gray-400 tracking-wider" 
                        value={formData.password} 
                        onChange={handleInputChange} 
                     />
                     <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showPassword ? <Eye size={16}/> : <EyeOff size={16}/>}
                     </button>
                 </div>

                 {/* Confirm Password Input */}
                 <div className="relative">
                     <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                     <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        name="confirmPassword"
                        required
                        placeholder="Confirm Password" 
                        className="w-full py-3.5 pl-12 pr-12 text-gray-700 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#36c2a6] focus:ring-1 focus:ring-[#36c2a6] transition-all placeholder:text-gray-400 tracking-wider" 
                        value={formData.confirmPassword} 
                        onChange={handleInputChange} 
                     />
                     <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showConfirmPassword ? <Eye size={16}/> : <EyeOff size={16}/>}
                     </button>
                 </div>
                 
                 {/* Terms and Conditions */}
                 <div className="flex items-center gap-3 pt-2">
                     <input type="checkbox" id="terms" required className="w-5 h-5 rounded border border-gray-300 text-[#36c2a6] focus:ring-[#36c2a6] cursor-pointer accent-[#36c2a6]" />
                     <label htmlFor="terms" className="text-sm font-bold text-gray-700 cursor-pointer">
                         I agree to all terms
                     </label>
                 </div>

                 {/* Action Buttons */}
                 <div className="w-full pt-4">
                     <button 
                         type="submit" 
                         disabled={isLoading} 
                         className="w-full bg-[#36c2a6] hover:bg-[#2ca38a] text-white border border-transparent font-black py-4 px-6 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-[#36c2a6]/30 disabled:opacity-70 shadow-md flex items-center justify-center tracking-widest uppercase"
                     >
                         {isLoading ? "Processing..." : "REGISTER"}
                     </button>
                 </div>

                 {/* Sign In Link */}
                 <div className="text-center pt-4">
                     <span className="text-sm text-gray-500 font-medium">Already have an account? </span>
                     <Link to="/login" className="text-sm text-[#36c2a6] hover:text-[#2da38b] font-black underline underline-offset-4">
                         Sign In
                     </Link>
                 </div>
             </form>
             
           </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
