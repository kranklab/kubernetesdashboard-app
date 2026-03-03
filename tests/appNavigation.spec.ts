import { test, expect } from './fixtures';
import { ROUTES } from '../src/constants';

test.describe('navigating app', () => {
  test('page Home should render successfully', async ({ gotoPage, page }) => {
    await gotoPage(`/${ROUTES.Home}`);
    await expect(page.getByRole('heading', { name: 'Cluster Overview' })).toBeVisible();
  });

});
