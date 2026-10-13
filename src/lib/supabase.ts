import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://uwygbhokcixvalkmvvck.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3eWdiaG9rY2l4dmFsa212dmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0ODQ0NzcsImV4cCI6MjEwNjA2MDQ3N30.SUiHez2vk50xlBzpNIB1305wY1PNhE0v0uKa83xDJ2g';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 40
    }
  }
});
