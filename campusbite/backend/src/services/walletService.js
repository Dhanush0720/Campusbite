const { v4: uuidv4 } = require('uuid');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');

// Atomically debits a user's wallet and writes an immutable ledger entry.
// Throws if the balance would go negative or the idempotency key was already used.
const debitWallet = async ({ userId, amount, referenceOrderId, note, idempotencyKey }, session) => {
  const key = idempotencyKey || uuidv4();

  const existing = await WalletTransaction.findOne({ idempotencyKey: key }).session(session);
  if (existing) return existing; // idempotent replay - do not double-debit

  const wallet = await Wallet.findOne({ userId }).session(session);
  if (!wallet) {
    const err = new Error('Wallet not found');
    err.statusCode = 404;
    throw err;
  }
  if (wallet.balance < amount) {
    const err = new Error('Insufficient wallet balance');
    err.statusCode = 402;
    throw err;
  }

  wallet.balance -= amount;
  await wallet.save({ session });

  const [txn] = await WalletTransaction.create(
    [{
      userId,
      type: 'DEBIT',
      amount,
      balanceAfter: wallet.balance,
      referenceOrderId,
      idempotencyKey: key,
      note,
    }],
    { session }
  );

  return txn;
};

const creditWallet = async ({ userId, amount, referenceOrderId, note, type = 'CREDIT', idempotencyKey }, session) => {
  const key = idempotencyKey || uuidv4();

  const existing = await WalletTransaction.findOne({ idempotencyKey: key }).session(session);
  if (existing) return existing;

  let wallet = await Wallet.findOne({ userId }).session(session);
  if (!wallet) {
    [wallet] = await Wallet.create([{ userId, balance: 0 }], { session });
  }

  wallet.balance += amount;
  await wallet.save({ session });

  const [txn] = await WalletTransaction.create(
    [{
      userId,
      type,
      amount,
      balanceAfter: wallet.balance,
      referenceOrderId,
      idempotencyKey: key,
      note,
    }],
    { session }
  );

  return txn;
};

module.exports = { debitWallet, creditWallet };
