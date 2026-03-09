import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dqqbjdnwvccqqsnbgnfv.supabase.co";
const supabaseKey = "sb_publishable_PNtS3684Yn142pxhXA4RJQ_g2gE7Qbo";

export const supabase = createClient(supabaseUrl, supabaseKey);
