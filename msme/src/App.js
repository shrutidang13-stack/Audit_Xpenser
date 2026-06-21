import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import Login from "./Login";
import Dashboard from "./Dashboard";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-blue-700 text-xl">Loading...</div>;

  return user ? <Dashboard user={user} /> : <Login />;
}

export default App;