import { useState } from "react";
import { auth } from "./firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      alert("Success!");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
        <h1 className="text-3xl font-bold text-blue-700 mb-2">MSME Guard</h1>
        <p className="text-gray-500 mb-6">AI-Powered Compliance Platform</p>
        <input
          className="w-full border p-3 rounded-lg mb-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border p-3 rounded-lg mb-3"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-700 text-white p-3 rounded-lg font-semibold hover:bg-blue-800"
        >
          {isSignUp ? "Sign Up" : "Login"}
        </button>
        <p
          className="text-center text-blue-600 mt-4 cursor-pointer"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? "Already have account? Login" : "New user? Sign Up"}
        </p>
      </div>
    </div>
  );
}