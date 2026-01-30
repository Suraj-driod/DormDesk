export const fetchUserProfile = async (supabase, user) => {
  if (!user) return null;

  // 1) Try management (admin/caretaker)
  const { data: management, error: mgmtErr } = await supabase
    .from("management")
    .select("*")
    .eq("id", user.id)
    .single();

  if (management && !mgmtErr) {
    return {
      name: management.full_name,
      role: management.is_admin ? "Admin" : "Caretaker",
      email: management.email,
      phone: management.phone,
      hostel: management.hostel_name,
      block: management.block_text,
      room: "-",
      floor: "-",
      avatarUrl: null,
      stats: { reported: 0, resolved: 0, pending: 0 }
    };
  }

  // 2) Try profiles (student)
  const { data: student, error: studentErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (student && !studentErr) {
    return {
      name: student.name,
      role: "Student",
      email: student.email,
      phone: student.phone,
      hostel: student.hostel,
      block: student.block,
      room: student.room_no,
      floor: student.floor,
      avatarUrl: null,
      stats: { reported: 0, resolved: 0, pending: 0 }
    };
  }

  // ❌ Not found
  return null;
};
