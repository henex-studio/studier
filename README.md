# Studier MVP

Studier is an internal tree test builder. Admin and user accounts can create tree tests. Testers complete published tests without logging in.

## What this starter includes

1. Login with Supabase Auth.
2. Admin and user roles through the `profiles` table.
3. Admin can see all studies. Users can see only their own studies.
4. Users are limited to 3 studies. Admin is unlimited.
5. Study builder with welcome text, privacy text, data collection settings, CSV paste, CSV upload, tree preview, tasks, target paths, acceptable paths and final questions.
6. Published public test links for anonymous testers.
7. Tester flow with Back, Next, Skip and answer update support.
8. Dashboard with task CSV and final questions CSV exports.

## Setup steps

1. Create a new Supabase project named `studier`.
2. Open Supabase SQL Editor.
3. Run `supabase/schema.sql`.
4. In Supabase Authentication, create your admin user and up to 3 user accounts.
5. In the `profiles` table, set your account role to `admin`. Set other accounts to `user`.
6. Create a new GitHub repo named `studier`.
7. Upload these files to GitHub.
8. Import the repo into Vercel.
9. Add environment variables in Vercel:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

10. Deploy.

## Notes

No public sign up is included. Create users manually in Supabase Auth.

If a user deletes a study, the study, tree, tasks, final questions, responses and final answers are deleted.

Closed studies cannot receive new tester submissions, but owners and admin can still view dashboards and export data.
