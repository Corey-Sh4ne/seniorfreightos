'use client';

import { useMemo, useState, useTransition } from 'react';
import Modal from '@/app/rate-card/_components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { createClient, deleteClient, updateClient } from '../_actions/clientActions';

const INPUT_CLS =
  'block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 ' +
  'shadow-sm placeholder:text-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none';

function TextField({ label, name, defaultValue, disabled, type = 'text', required }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-zinc-600">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        required={required}
        className={[INPUT_CLS, disabled ? 'cursor-not-allowed bg-zinc-50 text-zinc-500' : ''].join(' ')}
      />
    </div>
  );
}

export default function ClientFormModal({
  mode,
  client,
  rateCards,
  clerkUsers,
  linkedClerkIds,
  onClose,
}) {
  const isEdit = mode === 'edit';
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [clerkUserId, setClerkUserId] = useState(client?.clerkUserId ?? '');
  const [clerkSearch, setClerkSearch] = useState('');
  const [showClerkList, setShowClerkList] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deletePending, startDeleteTransition] = useTransition();

  const linkedSet = useMemo(() => new Set(linkedClerkIds), [linkedClerkIds]);

  const availableClerkUsers = useMemo(() => {
    return clerkUsers.filter((u) => !linkedSet.has(u.id) || u.id === clerkUserId);
  }, [clerkUsers, linkedSet, clerkUserId]);

  const filteredClerkUsers = useMemo(() => {
    const q = clerkSearch.trim().toLowerCase();
    if (!q) return availableClerkUsers;
    return availableClerkUsers.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [availableClerkUsers, clerkSearch]);

  const linkedUser = clerkUserId
    ? clerkUsers.find((u) => u.id === clerkUserId) ?? null
    : null;

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set('clerk_user_id', clerkUserId);

    startTransition(async () => {
      const res = isEdit
        ? await updateClient(client.id, fd)
        : await createClient(fd);
      if (res?.error) setError(res.error);
      else onClose();
    });
  }

  function handleDelete() {
    setDeleteError(null);
    startDeleteTransition(async () => {
      const res = await deleteClient(client.id);
      if (res?.error) {
        setDeleteError(res.error);
        return;
      }
      setShowDeleteConfirm(false);
      onClose();
    });
  }

  return (
    <Modal
      title={isEdit ? `Edit ${client.name}` : 'Add Client'}
      subtitle={isEdit ? 'Update contact info, rate card, and portal access' : 'Create a new client company'}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <TextField
          label="Company Name"
          name="name"
          defaultValue={isEdit ? client.name : ''}
          disabled={isEdit}
          required
        />
        <TextField label="Contact Name" name="contact_name" defaultValue={client?.contactName ?? ''} />
        <TextField label="Contact Email" name="contact_email" type="email" defaultValue={client?.contactEmail ?? ''} />
        <TextField label="Contact Phone" name="contact_phone" type="tel" defaultValue={client?.contactPhone ?? ''} />

        <div className="space-y-1">
          <label className="block text-xs font-medium text-zinc-600">Rate Card</label>
          <select
            name="rate_card_id"
            defaultValue={client?.rateCardId ?? ''}
            className={INPUT_CLS}
          >
            <option value="">Default</option>
            {rateCards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.name}{card.isDefault ? ' (system default)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-600">Link Clerk Account</label>
          <input type="hidden" name="clerk_user_id" value={clerkUserId} />

          {linkedUser ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900">{linkedUser.name}</p>
                <p className="truncate text-xs text-zinc-500">{linkedUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setClerkUserId('')}
                className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-white"
              >
                Unlink
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={clerkSearch}
                onChange={(e) => { setClerkSearch(e.target.value); setShowClerkList(true); }}
                onFocus={() => setShowClerkList(true)}
                placeholder="Search client portal accounts…"
                className={INPUT_CLS}
              />
              {showClerkList && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg">
                  {filteredClerkUsers.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-zinc-400">No accounts found.</p>
                  ) : (
                    filteredClerkUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setClerkUserId(u.id);
                          setClerkSearch('');
                          setShowClerkList(false);
                        }}
                        className="block w-full px-4 py-2.5 text-left hover:bg-zinc-50"
                      >
                        <p className="text-sm font-medium text-zinc-900">{u.name}</p>
                        <p className="text-xs text-zinc-500">{u.email}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-5">
          {isEdit ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={pending || deletePending}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              Delete Client
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {pending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </form>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Client?"
          message={`Are you sure you want to delete ${client.name}? This will not delete their projects but will remove the client record. Their Clerk account link will also be removed.`}
          confirmLabel="Delete Client"
          pending={deletePending}
          error={deleteError}
          onConfirm={handleDelete}
          onClose={() => {
            if (deletePending) return;
            setShowDeleteConfirm(false);
            setDeleteError(null);
          }}
        />
      )}
    </Modal>
  );
}
