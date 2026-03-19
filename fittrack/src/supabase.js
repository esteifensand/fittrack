import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const supabase = createClient(
  'https://jqnqivjklnmkrxzouigu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxbnFpdmprbG5ta3J4em91aWd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NTM2NTksImV4cCI6MjA4OTQyOTY1OX0.TqRWd9gssRqw-l5spqazZIVfgdqG_JiQDDPsJjFqkwA'
);
