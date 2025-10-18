import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { db } from '../db';
import type { Group } from '../types';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { CURRENCIES } from '../constants';
import { PlusIcon, EditIcon, Trash2Icon, FolderIcon } from '../components/common/Icons';

const GroupsPage: React.FC = () => {
  const { allGroups, allMembers, allExpenses, loading } = useData();
  
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Partial<Group> | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

  const groupData = useMemo(() => {
    return allGroups.map(group => {
      const members = allMembers.filter(m => m.groupId === group.id);
      const expenses = allExpenses.filter(e => e.groupId === group.id);
      return { ...group, memberCount: members.length, expenseCount: expenses.length };
    });
  }, [allGroups, allMembers, allExpenses]);

  const openAddModal = () => {
    setCurrentGroup({ name: '', currency: 'USD', type: 'group' });
    setModalOpen(true);
  };

  const openEditModal = (group: Group) => {
    setCurrentGroup(group);
    setModalOpen(true);
  };

  const openDeleteModal = (group: Group) => {
    setGroupToDelete(group);
    setDeleteModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentGroup(null);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setGroupToDelete(null);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGroup || !currentGroup.name?.trim()) return;

    const groupToSave: Omit<Group, 'id'> = {
      name: currentGroup.name.trim(),
      currency: currentGroup.currency || 'USD',
      type: currentGroup.type || 'group',
    };

    try {
      if (currentGroup.id) {
        await db.groups.update(currentGroup.id, groupToSave);
      } else {
        await db.groups.add(groupToSave as Group);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save group:', error);
      alert('Error saving group.');
    }
  };
  
  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    
    const membersInGroup = await db.members.where({ groupId: groupToDelete.id! }).count();
    const expensesInGroup = await db.expenses.where({ groupId: groupToDelete.id! }).count();

    if (membersInGroup > 0 || expensesInGroup > 0) {
      alert("Cannot delete group. Please remove all members and expenses from this group first.");
      handleCloseDeleteModal();
      return;
    }

    try {
      await db.groups.delete(groupToDelete.id!);
      handleCloseDeleteModal();
    } catch (error) {
      console.error('Failed to delete group:', error);
      alert('Error deleting group.');
    }
  };


  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Groups</h1>
        <Button onClick={openAddModal}>
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Group
        </Button>
      </div>

      {groupData.length === 0 ? (
        <Card className="text-center py-16">
          <FolderIcon className="w-16 h-16 mx-auto text-slate-400" />
          <h3 className="mt-4 text-xl font-medium">No groups yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Create a new group to start organizing your expenses.</p>
          <Button onClick={openAddModal} className="mt-6">Create Your First Group</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupData.map(group => (
            <Card key={group.id} className="flex flex-col">
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{group.name}</h2>
                  <span className="text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full capitalize">{group.type}</span>
                </div>
                <div className="mt-4 flex justify-around text-center border-t border-b border-slate-200 dark:border-slate-700 py-3 my-4">
                  <div>
                    <p className="text-2xl font-bold">{group.memberCount}</p>
                    <p className="text-sm text-slate-500">Members</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{group.expenseCount}</p>
                    <p className="text-sm text-slate-500">Expenses</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{CURRENCIES.find(c => c.code === group.currency)?.symbol || '$'}</p>
                    <p className="text-sm text-slate-500">Currency</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-auto">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEditModal(group)}>
                  <EditIcon className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button variant="danger" size="sm" className="flex-1" onClick={() => openDeleteModal(group)}>
                  <Trash2Icon className="w-4 h-4 mr-1" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentGroup?.id ? 'Edit Group' : 'Add New Group'}>
        <form onSubmit={handleSaveGroup} className="space-y-4">
          <div>
            <label htmlFor="groupName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Group Name</label>
            <Input
              id="groupName"
              value={currentGroup?.name || ''}
              onChange={e => setCurrentGroup(g => ({ ...g, name: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="groupType" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Group Type</label>
            <Select
              id="groupType"
              value={currentGroup?.type || 'group'}
              onChange={e => setCurrentGroup(g => ({ ...g, type: e.target.value as Group['type'] }))}
            >
              <option value="group">Group</option>
              <option value="family">Family</option>
              <option value="individual">Individual</option>
            </Select>
          </div>
          <div>
            <label htmlFor="groupCurrency" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Currency</label>
            <Select
              id="groupCurrency"
              value={currentGroup?.currency || 'USD'}
              onChange={e => setCurrentGroup(g => ({ ...g, currency: e.target.value }))}
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} title="Confirm Delete Group">
        <p className="text-slate-600 dark:text-slate-400 mb-6">
            Are you sure you want to delete <span className="font-bold">{groupToDelete?.name}</span>? This action is permanent and cannot be undone.
            <br/><br/>
            <span className="font-bold text-red-500">You can only delete a group if it has no members and no expenses.</span>
        </p>
        <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleCloseDeleteModal}>Cancel</Button>
            <Button type="button" variant="danger" onClick={handleDeleteGroup}>Delete</Button>
        </div>
      </Modal>

    </div>
  );
};

export default GroupsPage;
