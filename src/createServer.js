'use strict';

const express = require('express');

function createServer() {
  const app = express();

  // Дозволяємо серверу читати JSON з тіла запиту
  app.use(express.json());

  // Наші бази даних у пам'яті
  const users = [];
  const expenses = [];

  // Змінні для генерації унікальних ID
  let currentUserId = 1;
  let currentExpenseId = 1;

  // Перевіряє, що параметр :id - валідне ціле додатне число.
  // Якщо ні - одразу відправляє 400 і повертає null,
  // щоб виклик міг завершити обробку (return).
  function parseId(idParam, res) {
    const id = Number(idParam);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid id' });

      return null;
    }

    return id;
  }

  // ==========================================
  // USERS ENDPOINTS
  // ==========================================

  // 1. Отримати всіх користувачів (GET /users)
  app.get('/users', (req, res) => {
    res.status(200).json(users);
  });

  // 2. Отримати одного користувача за ID (GET /users/:id)
  app.get('/users/:id', (req, res) => {
    const id = parseId(req.params.id, res);

    if (id === null) {
      return;
    }

    const user = users.find((u) => u.id === id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  });

  // 3. Створити нового користувача (POST /users)
  app.post('/users', (req, res) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const newUser = {
      id: currentUserId++,
      name,
    };

    users.push(newUser);
    res.status(201).json(newUser);
  });

  // 4. Оновити користувача (PATCH /users/:id)
  app.patch('/users/:id', (req, res) => {
    const id = parseId(req.params.id, res);

    if (id === null) {
      return;
    }

    const user = users.find((u) => u.id === id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name } = req.body;

    if (name !== undefined) {
      user.name = name;
    }

    res.status(200).json(user);
  });

  // 5. Видалити користувача (DELETE /users/:id)
  app.delete('/users/:id', (req, res) => {
    const id = parseId(req.params.id, res);

    if (id === null) {
      return;
    }

    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users.splice(userIndex, 1);
    res.status(204).send();
  });

  // ==========================================
  // EXPENSES ENDPOINTS
  // ==========================================

  // 1. Отримати всі витрати з фільтрацією (GET /expenses)
  app.get('/expenses', (req, res) => {
    let filteredExpenses = [...expenses];

    // Додаємо сюди ще categories, щоб точно спіймати параметр
    const { userId, category, categories, from, to } = req.query;

    if (userId) {
      filteredExpenses = filteredExpenses.filter(
        (e) => e.userId === Number(userId),
      );
    }

    // Перевіряємо обидва варіанти: і category, і categories
    const categoryParam = category || categories;

    if (categoryParam) {
      const categoriesArray = Array.isArray(categoryParam)
        ? categoryParam
        : categoryParam.split(',');
      // eslint-disable-next-line
      filteredExpenses = filteredExpenses.filter((e) => {
        return categoriesArray.includes(e.category);
      });
    }

    // Фільтрація за часом (ти писав, що вони використовують from та to)
    if (from) {
      filteredExpenses = filteredExpenses.filter(
        (e) => new Date(e.spentAt) >= new Date(from),
      );
    }

    if (to) {
      filteredExpenses = filteredExpenses.filter(
        (e) => new Date(e.spentAt) <= new Date(to),
      );
    }

    res.status(200).json(filteredExpenses);
  });

  // 2. Отримати одну витрату за ID (GET /expenses/:id)
  app.get('/expenses/:id', (req, res) => {
    const id = parseId(req.params.id, res);

    if (id === null) {
      return;
    }

    const expense = expenses.find((e) => e.id === id);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.status(200).json(expense);
  });

  // 3. Створити нову витрату (POST /expenses)
  app.post('/expenses', (req, res) => {
    const { userId, spentAt, title, amount, category, note } = req.body;

    // Перевіряємо наявність обов'язкових полів
    if (!userId || !spentAt || !title || !amount || !category) {
      return res.status(400).json({ error: 'Bad request' });
    }

    // Перевіряємо, чи існує користувач
    const userExists = users.some((u) => u.id === userId);

    if (!userExists) {
      return res.status(400).json({ error: 'User not found' });
    }

    const newExpense = {
      id: currentExpenseId++,
      userId,
      spentAt,
      title,
      amount,
      category,
      note: note || undefined,
    };

    expenses.push(newExpense);
    res.status(201).json(newExpense);
  });

  // 4. Оновити витрату (PATCH /expenses/:id)
  app.patch('/expenses/:id', (req, res) => {
    const id = parseId(req.params.id, res);

    if (id === null) {
      return;
    }

    const expense = expenses.find((e) => e.id === id);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const { userId, spentAt, title, amount, category, note } = req.body;

    if (userId !== undefined) {
      expense.userId = userId;
    }

    if (spentAt !== undefined) {
      expense.spentAt = spentAt;
    }

    if (title !== undefined) {
      expense.title = title;
    }

    if (amount !== undefined) {
      expense.amount = amount;
    }

    if (category !== undefined) {
      expense.category = category;
    }

    if (note !== undefined) {
      expense.note = note;
    }

    res.status(200).json(expense);
  });

  // 5. Видалити витрату (DELETE /expenses/:id)
  app.delete('/expenses/:id', (req, res) => {
    const id = parseId(req.params.id, res);

    if (id === null) {
      return;
    }

    const expenseIndex = expenses.findIndex((e) => e.id === id);

    if (expenseIndex === -1) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    expenses.splice(expenseIndex, 1);
    res.status(204).send();
  });

  return app;
}

module.exports = { createServer };
