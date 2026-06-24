-- ============================================================
-- EduFlick AI — LMS Automation Engine
-- Automation triggers — implements requirements #1, #2, #3
-- Run AFTER 01_schema.sql and 02_seed.sql.
-- ============================================================

-- ------------------------------------------------------------
-- Trigger A — handle_new_user
-- Fires when: a new row is inserted into auth.users (i.e. a
--             student registers, requirement #1).
-- Action:     creates the matching profiles row with the same
--             id, so profiles.id == auth.users.id for every
--             real student.
-- ------------------------------------------------------------
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ------------------------------------------------------------
-- Trigger B — fn_generate_roadmap
-- Fires when: a profile flips onboarding_complete from false
--             to true with a track_id set (i.e. the student
--             has finished register -> track -> mentor,
--             requirement #1's final step).
-- Action:     generates the full roadmap for that student
--             (requirement #2) by inserting one lesson_progress
--             row per lesson in the chosen track, then unlocks
--             only the very first lesson (module 1 / lesson 1),
--             satisfying requirement #3's starting state.
-- ------------------------------------------------------------
create or replace function fn_generate_roadmap()
returns trigger as $$
declare
  first_lesson_id bigint;
begin
  if new.onboarding_complete = true
     and coalesce(old.onboarding_complete, false) = false
     and new.track_id is not null then

    -- Create a locked progress row for every lesson in the track
    insert into lesson_progress (user_id, lesson_id, is_unlocked, is_completed)
    select new.id, l.id, false, false
    from lessons l
    join modules m on m.id = l.module_id
    where m.track_id = new.track_id
    on conflict (user_id, lesson_id) do nothing;

    -- Find the very first lesson: lowest module order, then lowest lesson order
    select l.id into first_lesson_id
    from lessons l
    join modules m on m.id = l.module_id
    where m.track_id = new.track_id
    order by m."order" asc, l."order" asc
    limit 1;

    -- Unlock only that first lesson
    update lesson_progress
       set is_unlocked = true
     where user_id = new.id
       and lesson_id = first_lesson_id;

  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_generate_roadmap on profiles;
create trigger trg_generate_roadmap
  after update on profiles
  for each row execute function fn_generate_roadmap();


-- ------------------------------------------------------------
-- Trigger C — fn_unlock_next_lesson
-- Fires when: a lesson_progress row flips is_completed from
--             false to true (the student finishes a lesson,
--             requirement #3).
-- Action:     stamps completed_at, then finds the "next" lesson
--             — either the next lesson in the same module, or
--             lesson 1 of the next module if this was the last
--             lesson — and sets is_unlocked = true for it.
--             This is the sequential unlocking chain.
-- ------------------------------------------------------------
create or replace function fn_unlock_next_lesson()
returns trigger as $$
declare
  cur_module_id  bigint;
  cur_order      int;
  cur_track_id   bigint;
  next_lesson_id bigint;
begin
  if new.is_completed = true and coalesce(old.is_completed, false) = false then

    new.completed_at := now();

    select l.module_id, l."order", m.track_id
      into cur_module_id, cur_order, cur_track_id
    from lessons l
    join modules m on m.id = l.module_id
    where l.id = new.lesson_id;

    -- 1) Next lesson within the same module
    select l.id into next_lesson_id
    from lessons l
    where l.module_id = cur_module_id
      and l."order" = cur_order + 1;

    -- 2) If none, lesson 1 of the next module in the same track
    if next_lesson_id is null then
      select l.id into next_lesson_id
      from lessons l
      join modules m on m.id = l.module_id
      where m.track_id = cur_track_id
        and l."order" = 1
        and m."order" = (
          select min(m2."order")
          from modules m2
          where m2.track_id = cur_track_id
            and m2."order" > (select "order" from modules where id = cur_module_id)
        );
    end if;

    -- 3) Unlock it (row already exists from fn_generate_roadmap, just locked)
    if next_lesson_id is not null then
      update lesson_progress
         set is_unlocked = true
       where user_id = new.user_id
         and lesson_id = next_lesson_id;
    end if;

  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_unlock_next_lesson on lesson_progress;
create trigger trg_unlock_next_lesson
  before update on lesson_progress
  for each row execute function fn_unlock_next_lesson();


-- ============================================================
-- Row Level Security
-- ============================================================
alter table tracks enable row level security;
alter table mentors enable row level security;
alter table modules enable row level security;
alter table lessons enable row level security;
alter table profiles enable row level security;
alter table lesson_progress enable row level security;

-- Curriculum / reference data: readable by any signed-in user
create policy "tracks readable" on tracks for select using (true);
create policy "mentors readable" on mentors for select using (true);
create policy "modules readable" on modules for select using (true);
create policy "lessons readable" on lessons for select using (true);

-- profiles: a student can only see and edit their own row
create policy "profile self select" on profiles
  for select using (auth.uid() = id);
create policy "profile self update" on profiles
  for update using (auth.uid() = id);
create policy "profile self insert" on profiles
  for insert with check (auth.uid() = id);

-- lesson_progress: a student can only see and edit their own rows
create policy "progress self select" on lesson_progress
  for select using (auth.uid() = user_id);
create policy "progress self update" on lesson_progress
  for update using (auth.uid() = user_id);
create policy "progress self insert" on lesson_progress
  for insert with check (auth.uid() = user_id);
