import { test, expect, Page, Request, APIResponse } from '@playwright/test';

// Tipos personalizados
interface Task {
  id: string;
  title: string;
  description: string;
}