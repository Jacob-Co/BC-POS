import { Fragment } from 'react';
import { UserProviderWrapper } from './UserContext';
import { ItemsProviderWrapper } from './ItemContext';
import { ReceiptProviderWrapper } from './ReceiptContext';

export default function ContainerContexts({ children }) {

	return (
		<Fragment>
			<UserProviderWrapper>
				<ItemsProviderWrapper>
					<ReceiptProviderWrapper>
						{ children }
					</ReceiptProviderWrapper>
				</ItemsProviderWrapper>
			</UserProviderWrapper>
		</Fragment>
	)
}