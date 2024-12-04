import type { Locator, Page } from '@playwright/test';

import { CreateRoomModal } from './create-room-modal';
import { expect } from '../../utils/test';

export class Sidebar {
	private readonly page: Page;

	readonly newRoomModal: CreateRoomModal;

	constructor(page: Page) {
		this.page = page;
		this.newRoomModal = new CreateRoomModal(page);
	}

	// New navigation locators
	get sidebar(): Locator {
		return this.page.getByRole('navigation', { name: 'sidebar' });
	}

	get btnRecent(): Locator {
		return this.searchSection.getByRole('button', { name: 'Recent' });
	}

	get channelsList(): Locator {
		return this.sidebar.getByRole('list', { name: 'Channels' });
	}

	get searchSection(): Locator {
		return this.sidebar.getByRole('search');
	}

	get searchList(): Locator {
		return this.searchSection.getByRole('list', { name: 'Channels' });
	}

	get firstCollapser(): Locator {
		return this.channelsList.getByRole('button').first();
	}

	get firstChannelFromList(): Locator {
		return this.channelsList.getByRole('listitem').first();
	}

	get searchInput(): Locator {
		return this.searchSection.getByRole('searchbox');
	}

	async setDisplayMode(mode: 'Extended' | 'Medium' | 'Condensed'): Promise<void> {
		await this.sidebarSearchSection.getByRole('button', { name: 'Display', exact: true }).click();
		await this.sidebarSearchSection.getByRole('menuitemcheckbox', { name: mode }).click();
		await this.sidebarSearchSection.click();
	}

	async escSearch(): Promise<void> {
		await this.page.keyboard.press('Escape');
	}

	async waitForChannel(): Promise<void> {
		await this.page.locator('role=main').waitFor();
		await this.page.locator('role=main >> role=heading[level=1]').waitFor();
		const messageList = this.page.getByRole('main').getByRole('list', { name: 'Message list', exact: true });
		await messageList.waitFor();

		await expect(messageList).not.toHaveAttribute('aria-busy', 'true');
	}

	async typeSearch(name: string): Promise<void> {
		return this.searchInput.fill(name);
	}

	getSearchRoomByName(name: string): Locator {
		return this.searchList.getByRole('link', { name });
	}

	getSidebarItemByName(name: string): Locator {
		return this.channelsList.getByRole('link', { name });
	}

	async openChat(name: string): Promise<void> {
		await this.typeSearch(name);
		await this.getSearchRoomByName(name).click();
	}

	async openItemMenu(item: Locator): Promise<void> {
		await item.hover();
		await item.focus();
		await item.locator('.rcx-sidebar-item__menu').click();
	}

	async markItemAsUnread(item: Locator): Promise<void> {
		await this.openItemMenu(item);
		await this.page.getByRole('option', { name: 'Mark Unread' }).click();
	}

	async selectPriority(name: string, priority: string) {
		const item = this.getSidebarItemByName(name);
		await this.openItemMenu(item);
		await this.page.getByRole('option', { name: priority }).click();
	}

	getCollapseGroupByName(name: string): Locator {
		return this.channelsList.getByRole('button').filter({ has: this.page.getByRole('heading', { name, exact: true }) });
	}

	getItemUnreadBadge(item: Locator): Locator {
		return item.getByRole('status', { name: 'unread' });
	}

	// Note: this is different from openChat because queued chats are not searchable
	getQueuedChat(name: string): Locator {
		return this.page.locator('[data-qa="sidebar-item-title"]', { hasText: new RegExp(`^${name}$`) }).first();
	}

	async openCreateNewByLabel(name: 'Direct message' | 'Discussion' | 'Channel' | 'Team'): Promise<void> {
		await this.searchSection.getByRole('button', { name: 'Create new', exact: true }).click();
		await this.page.getByRole('menuitem', { name }).click();
	}

	async setDisplayMode(mode: 'Extended' | 'Medium' | 'Condensed'): Promise<void> {
		await this.searchSection.getByRole('button', { name: 'Display', exact: true }).click();
		await this.sidebar.getByRole('menuitemcheckbox', { name: mode }).click();
		await this.searchSection.click();
	}

	async createEncryptedChannel(name: string) {
		await this.openCreateNewByLabel('Channel');
		await this.newRoomModal.inputChannelName.fill(name);
	}

	async createPublicChannel(name: string) {
		await this.openCreateNewByLabel('Channel');
		await this.newRoomModal.checkboxPrivate.click();
		await this.newRoomModal.inputChannelName.fill(name);
		await this.newRoomModal.btnCreate.click();
	}
}
