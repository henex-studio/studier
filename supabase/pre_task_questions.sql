alter table public.study_final_questions
add column if not exists question_position text not null default 'final'
check (question_position in ('pre', 'final'));

update public.study_final_questions
set question_position = 'final'
where question_position is null;

create index if not exists study_final_questions_position_order_idx
on public.study_final_questions (study_id, question_position, question_order);
