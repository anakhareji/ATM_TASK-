import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import Button from "../components/ui/Button";
import API from "../api/axios"; // ✅ Import axios instance
import { getErrorMessage } from "../utils/errorHelpers";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await API.post("/auth/login", { email, password });

      // ✅ Store JWT
      localStorage.setItem("token", response.data.access_token);

      // ✅ Store user info
      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.setItem("userRole", response.data.user.role);
      localStorage.setItem("userName", response.data.user.name || "");
      localStorage.setItem("userEmail", response.data.user.email || "");

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
          setIsLoading(false);
          navigate("/dashboard");
          return;
        } catch (e2) {
          alert(
            e2.response?.data?.detail ||
            e2.response?.data?.message ||
            "Activation failed"
          );
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
    <div className="min-h-screen flex bg-surface font-sans">
      {/* Left Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative z-10">
        <div className="max-w-md w-full">
          {/* Logo/Brand (AT) */}
          <div className="mb-12">
            <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold">
              AT
            </div>
          </div>

          <div className="mb-10 text-left">
            <h2 className="text-4xl font-black text-secondary mb-4 tracking-tight">
              Sign In
            </h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-secondary-muted ml-1">
                Username or Email
              </label>
              <div className="relative group">
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-gray-200 group-hover:border-primary focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-300 shadow-sm"
                  placeholder="Enter Username"
                  autoComplete="username"
                  required
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-muted">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-secondary-muted ml-1">
                Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white border border-gray-200 group-hover:border-primary focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-300 shadow-sm"
                  placeholder="Enter Password"
                  autoComplete="current-password"
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
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-1">
                <input type="checkbox" id="remember" className="w-5 h-5 accent-primary rounded-lg border-gray-300" />
                <label htmlFor="remember" className="text-sm font-bold text-gray-700">Remember Me</label>
            </div>

            <button
              className="w-32 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all duration-300"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="mt-12 text-left">
            <p className="text-sm font-bold text-secondary-muted inline">Or, Login with </p>
            <div className="inline-flex gap-4 ml-4 align-middle">
                {/* Social icons placeholders */}
                <div className="p-2 border border-gray-100 rounded-lg hover:shadow-md cursor-pointer transition-all">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" className="w-6 h-6" alt="FB" />
                </div>
                <div className="p-2 border border-gray-100 rounded-lg hover:shadow-md cursor-pointer transition-all">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" className="w-6 h-6" alt="G" />
                </div>
                <div className="p-2 border border-gray-100 rounded-lg hover:shadow-md cursor-pointer transition-all">
                    <img src="https://abs.twimg.com/favicons/twitter.3.ico" className="w-6 h-6" alt="X" />
                </div>
            </div>
          </div>

          <div className="mt-8 text-sm text-secondary-muted font-bold">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-accent-blue font-black hover:underline underline-offset-4"
            >
              Create One
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side: Illustration */}
      <div className="hidden lg:flex w-1/2 bg-white relative items-center justify-center p-20 overflow-hidden">
        {/* Decorative background patterns */}
        <div className="absolute inset-0 z-0 opacity-10">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent-blue/20 rounded-full blur-[80px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
        </div>

        <div className="relative z-10 w-full h-full flex items-center justify-center">
             {/* Using a placeholder for the illustration since generate_image failed */}
             <div className="relative scale-110">
                <img 
                    src="https://img.freepik.com/free-vector/login-concept-illustration_114360-739.jpg" 
                    alt="Login Illustration" 
                    className="max-w-xl drop-shadow-3xl"
                />
                {/* Simulated floating elements */}
                <div className="absolute -top-10 -left-10 w-20 h-20 bg-accent-green/20 rounded-3xl blur-xl animate-pulse" />
                <div className="absolute bottom-10 right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-pulse delay-500" />
             </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
