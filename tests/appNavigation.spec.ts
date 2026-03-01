import { test, expect } from './fixtures';
import { ROUTES } from '../src/constants';

test.describe('navigating app', () => {
  test('page Home should support an id parameter', async ({ gotoPage, page }) =>{
    await gotoPage(`/${ROUTES.Home}`);
    await expect(
      page.getByText(
        'This scene showcases a basic scene functionality, including query runner, variable and a custom scene object.'
      )
    ).toBeVisible();
  });

});
