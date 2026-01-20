import { useState } from "react";
import { AppRoutes } from "./routes/AppRoutes";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div style={{"textAlign" : "center"}}>
        <p>{count}</p>
        <button
          onClick={() => {
            setCount((prev) => prev + 1);
          }}
        >
          Click
        </button>
      </div>
      <AppRoutes/>
    </>
  );
}

export default App;
