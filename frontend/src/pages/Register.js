import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, UserPlus, GraduationCap, BookOpen } from "lucide-react";
import Button from "../components/ui/Button";
import API from "../api/axios";
import { getErrorMessage } from "../utils/errorHelpers";

const Register = () => {
    const [role, setRole] = useState("student"); // student or faculty
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);

        try {
            const endpoint = role === "student" ? "/auth/register/student" : "/auth/register/faculty";
            await API.post(endpoint, {
                name: formData.name,
                email: formData.email,
                password: formData.password
            });

            // Success - redirect to login with success message
            alert("Registration successful! Your account is pending admin approval. You'll be able to login once approved.");
            navigate("/login");
        } catch (err) {
            setIsLoading(false);
            setError(getErrorMessage(err, "Registration failed. Please try again."));
        }
    };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex bg-surface font-sans">
      {/* Left Side: Illustration */}
      <div className="hidden lg:flex w-1/2 bg-white relative items-center justify-center p-20 overflow-hidden">
        {/* Decorative background patterns */}
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-accent-blue/20 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <div className="relative">
            {/* Using a placeholder for the registration illustration */}
            <img 
              src="https://img.freepik.com/free-vector/sign-up-concept-illustration_114360-7885.jpg" 
              alt="Register Illustration" 
              className="max-w-xl drop-shadow-3xl"
            />
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative z-10">
        <div className="max-w-xl w-full">
          {/* Logo/Brand (AT) */}
          <div className="mb-10 flex justify-end">
             <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xs">
                AT
             </div>
          </div>

          <div className="mb-8">
            <h2 className="text-4xl font-black text-secondary tracking-tight">
              Sign Up
            </h2>
          </div>

          {/* Role Selection (Kept from original logic) */}
          <div className="mb-8 p-1 bg-gray-50 rounded-2xl flex border border-gray-100">
             <button 
                onClick={() => setRole("student")}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${role === "student" ? "bg-white text-primary shadow-sm" : "text-secondary-muted"}`}
             >
                Student
             </button>
             <button 
                onClick={() => setRole("faculty")}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${role === "faculty" ? "bg-white text-primary shadow-sm" : "text-secondary-muted"}`}
             >
                Faculty
             </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-6 gap-y-4" autoComplete="off">
            <div className="space-y-1">
              <div className="relative group">
                <input
                  type="text"
                  name="firstName"
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-gray-200 group-hover:border-primary focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-300 shadow-sm"
                  placeholder="Enter First Name"
                  required
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-muted">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="relative group">
                <input
                  type="text"
                  name="lastName"
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-gray-200 group-hover:border-primary focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-300 shadow-sm"
                  placeholder="Enter Last Name"
                  required
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-muted">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
              </div>
            </div>

            <div className="col-span-2 space-y-1">
              <div className="relative group">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-gray-200 group-hover:border-primary focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-300 shadow-sm"
                  placeholder="Enter Username"
                  required
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-muted">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
              </div>
            </div>

            <div className="col-span-2 space-y-1">
              <div className="relative group">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-gray-200 group-hover:border-primary focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-300 shadow-sm"
                  placeholder="Enter Email"
                  required
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-muted">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
              </div>
            </div>

            <div className="col-span-2 space-y-1">
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white border border-gray-200 group-hover:border-primary focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-300 shadow-sm"
                  placeholder="Enter Password"
                  required
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-muted">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-muted hover:text-primary transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="col-span-2 space-y-1">
              <div className="relative group">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white border border-gray-200 group-hover:border-primary focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-300 shadow-sm"
                  placeholder="Confirm Password"
                  required
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-muted">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-muted hover:text-primary transition-colors p-1"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="col-span-2 flex items-center gap-3 ml-1 mt-2">
                <input type="checkbox" id="terms" required className="w-5 h-5 accent-primary rounded-lg border-gray-300" />
                <label htmlFor="terms" className="text-sm font-bold text-gray-700">I agree to all terms</label>
            </div>

            <div className="col-span-2 mt-6">
              <button
                className="w-40 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all duration-300 uppercase tracking-widest text-xs"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? "Processing..." : "Register"}
              </button>
            </div>
          </form>

          <div className="mt-10 text-sm font-bold text-secondary-muted">
              Already have an account?{" "}
              <Link to="/login" className="text-accent-blue font-black hover:underline underline-offset-4">
                Sign In
              </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
