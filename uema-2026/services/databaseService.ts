
import { User, REURBProcess, REURBDocument, ProcessStatus } from '../types/index';

class SQLDatabase {
  private getStorage(table: string) {
    const data = localStorage.getItem(`reurb_db_${table}`);
    return data ? JSON.parse(data) : [];
  }

  private setStorage(table: string, data: any) {
    localStorage.setItem(`reurb_db_${table}`, JSON.stringify(data));
  }

  users = {
    selectAll: (): User[] => {
      return this.getStorage('users');
    },
    insert: (user: any) => {
      const users = this.getStorage('users');
      const newUser = {
        id: `u-${Date.now()}`,
        avatar: user.avatar || `https://picsum.photos/seed/${user.name}/200`,
        quota: { limit: 10000, used: 0, resetAt: new Date(Date.now() + 3600000).toISOString() },
        lastLogin: new Date().toISOString(),
        status: 'Offline',
        ...user
      };
      users.push(newUser);
      this.setStorage('users', users);
      return newUser;
    },
    findByEmail: (email: string) => {
      const users = this.getStorage('users');
      return users.find((u: any) => u.email === email);
    },
    updateActivity: (userId: string) => {
      const users = this.getStorage('users');
      const idx = users.findIndex((u: any) => u.id === userId);
      if (idx !== -1) {
        users[idx].lastLogin = new Date().toISOString();
        users[idx].status = 'Online';
        this.setStorage('users', users);
        
        const currentUserStr = localStorage.getItem('reurb_current_user');
        if (currentUserStr) {
          const currentUser = JSON.parse(currentUserStr);
          if (currentUser.id === userId) {
            localStorage.setItem('reurb_current_user', JSON.stringify(users[idx]));
          }
        }
      }
    },
    updateQuota: (userId: string, tokensUsed: number) => {
      const users = this.getStorage('users');
      const idx = users.findIndex((u: any) => u.id === userId);
      if (idx !== -1) {
        users[idx].quota.used += tokensUsed;
        this.setStorage('users', users);
        const currentUserStr = localStorage.getItem('reurb_current_user');
        if (currentUserStr) {
          const currentUser = JSON.parse(currentUserStr);
          if (currentUser.id === userId) {
            currentUser.quota = users[idx].quota;
            localStorage.setItem('reurb_current_user', JSON.stringify(currentUser));
          }
        }
        return users[idx];
      }
      return null;
    }
  };

  processes = {
    selectAll: (): REURBProcess[] => {
      return this.getStorage('processes');
    },
    insert: (process: Partial<REURBProcess>) => {
      const processes = this.getStorage('processes');
      const year = new Date().getFullYear();
      const count = processes.filter((p: any) => p.protocol?.startsWith(year.toString())).length + 1;
      const protocol = `${year}.${String(count).padStart(4, '0')}`;
      
      const newProcess = {
        id: `PR-${year}-${Math.floor(1000 + Math.random() * 9000)}`,
        protocol: protocol,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        status: ProcessStatus.INICIAL,
        progress: 10,
        area: '0 m²',
        responsibleName: 'Não atribuído',
        ...process
      };
      processes.unshift(newProcess);
      this.setStorage('processes', processes);
      return newProcess;
    },
    updateStatus: (id: string, status: ProcessStatus) => {
      const processes = this.getStorage('processes');
      const idx = processes.findIndex((p: any) => p.id === id);
      if (idx !== -1) {
        processes[idx].status = status;
        processes[idx].updatedAt = new Date().toISOString().split('T')[0];
        this.setStorage('processes', processes);
      }
    }
  };

  documents = {
    findByProcessId: (processId: string): REURBDocument[] => {
      const docs = this.getStorage('documents');
      return docs.filter((d: any) => d.processId === processId);
    },
    upsert: (doc: Partial<REURBDocument>) => {
      const docs = this.getStorage('documents');
      const existingIdx = docs.findIndex((d: any) => d.id === doc.id);
      const now = new Date().toISOString();
      
      if (existingIdx !== -1) {
        const updatedDoc = { ...docs[existingIdx], ...doc, updatedAt: now };
        docs[existingIdx] = updatedDoc;
        this.setStorage('documents', docs);
        return updatedDoc;
      } else {
        const newDoc = {
          id: `doc-${Date.now()}`,
          version: 1,
          updatedAt: now,
          status: 'Draft',
          ...doc
        };
        docs.push(newDoc);
        this.setStorage('documents', docs);
        return newDoc;
      }
    }
  };
}

export const dbService = new SQLDatabase();

const initDB = () => {
  const usersData = localStorage.getItem('reurb_db_users');
  if (!usersData || JSON.parse(usersData).length === 0) {
    const defaultUsers = [
      {
        id: 'u-admin',
        name: 'Administrador do Sistema',
        email: 'admin@reurb.gov.br',
        password: 'Admin123!',
        role: 'Jurídico',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        status: 'Offline',
        lastLogin: new Date().toISOString(),
        quota: { limit: 50000, used: 0, resetAt: new Date(Date.now() + 86400000).toISOString() }
      }
    ];
    localStorage.setItem('reurb_db_users', JSON.stringify(defaultUsers));
  }
};

initDB();
