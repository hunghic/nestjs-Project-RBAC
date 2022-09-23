import { Injectable } from '@nestjs/common';
import { Database, getDatabase, Reference } from 'firebase-admin/database';
import { App, initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import * as serviceAccount from './configs/certificate.json';

@Injectable()
export class FirebaseDatabaseService {
  private database: Database;

  constructor() {
    const app: App = initializeApp({
      credential: cert(serviceAccount as ServiceAccount),
      databaseURL:
        'https://nestshoq-default-rtdb.asia-southeast1.firebasedatabase.app',
    });

    this.database = getDatabase(app);
  }

  getNodeReference(nodePath: string): Reference {
    return this.database.ref(nodePath);
  }
}
