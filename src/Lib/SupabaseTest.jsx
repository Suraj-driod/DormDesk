import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function SupabaseTest() {
  const [data, setData] = useState([]);

  useEffect(() => {
    getData();
  }, []);

  async function getData() {
    const { data: incomingData, error } = await supabase.from("Dummy").select();
    if (error) {
      console.error("Error fetching data:", error);
      return;
    }
    setData(incomingData || []);
  }

  return (
    <ul>
      {data.map((da) => (
        <li key={da.id}>
          {da.Name} : {da.email} , {da.age}
        </li>
      ))}
    </ul>
  );
}
