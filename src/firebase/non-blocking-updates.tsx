
'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  CollectionReference,
  DocumentReference,
  SetOptions,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Registra um log de auditoria para ações críticas.
 */
async function logAuditAction(db: any, action: string, path: string, data?: any) {
  try {
    const userId = window.localStorage.getItem('rgmj_user_id') || 'system';
    const userName = window.localStorage.getItem('rgmj_user_name') || 'Sistema';
    
    // Obtém IP do cliente de forma não-bloqueante
    let ip = '0.0.0.0';
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const ipData = await response.json();
      ip = ipData.ip;
    } catch { /* falha silenciosa no IP */ }

    addDoc(collection(db, 'audit_logs'), {
      userId,
      userName,
      action,
      collection: path.split('/')[0],
      docId: path.split('/').pop(),
      ip,
      metadata: data ? { keys: Object.keys(data) } : {},
      createdAt: serverTimestamp()
    });
  } catch (e) {
    console.warn('Audit Log falhou:', e);
  }
}

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  setDoc(docRef, data, options)
    .then(() => logAuditAction(docRef.firestore, 'write', docRef.path, data))
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'write',
          requestResourceData: data,
        })
      )
    })
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const promise = addDoc(colRef, data)
    .then((docRef) => {
      logAuditAction(colRef.firestore, 'create', docRef.path, data);
      return docRef;
    })
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: data,
        })
      )
    });
  return promise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data)
    .then(() => logAuditAction(docRef.firestore, 'update', docRef.path, data))
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        })
      )
    });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef)
    .then(() => logAuditAction(docRef.firestore, 'delete', docRef.path))
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      )
    });
}
