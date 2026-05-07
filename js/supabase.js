// Importa o cliente do Supabase diretamente via CDN
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabaseUrl = "https://qpdzanjnreklmppmtzxm.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZHphbmpucmVrbG1wcG10enhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNTc4NzEsImV4cCI6MjA5MzczMzg3MX0.QIGY3Cp0_RJFItmiXgUfsBeI5DCs0FW5KXwnfAilQXg";

// Exporta a instância do banco para ser usada nas outras telas
export const supabase = createClient(supabaseUrl, supabaseKey);
