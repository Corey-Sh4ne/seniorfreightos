-- Migration: 005_add_delivered_project_status
-- The status pipeline (src/utils/statusPipeline.js) and statusConfig.js define a
-- 'delivered' stage between 'scheduled' (Out for Delivery) and 'installing'
-- (Installing), but the original CHECK constraint in 001_create_projects omitted
-- it. The Order Management System advances projects scheduled -> delivered ->
-- installing, so 'delivered' must be a permitted status value.

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE projects
  ADD CONSTRAINT projects_status_check
  CHECK (status IN (
    'prospect','quoted','awarded','receiving','staging',
    'scheduled','delivered','installing','complete','invoiced'
  ));
