import { Fragment, useEffect, useState } from "react";
import { Product } from "../Models/GlovoModels";
import { Button, Form, InputGroup, Table, Image, Container } from "react-bootstrap";

const ProductAdder = () => {
	const [list, setList] = useState<Product[]>([]);
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [response, setResponse] = useState<string>('');

	const onSearchQueryChange = (event: any) => {
		setSearchQuery(event.target.value);
	}

	const onAddClick = (event: any) => {
		const selected = list.filter(item => item.selected);

		const productMatches = {
			productName: searchQuery,
			matches: selected.map(item => {
				return {
					url: item.url,
					productId: item.id,
					store: item.store,
				}
			})
		};

		fetch('http://localhost/api/products/save', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'token': localStorage.getItem('token') || '',
			},
			body: JSON.stringify(productMatches)
		})
			.then(response => response.text())
			.then(data => {
				console.log(data);
			});


	}

	const onSearchClick = (event: any) => {
		setList([]);
		setResponse('Loading...');
		
		setTimeout(() => {
			fetch('http://localhost/api/products/search?name=' + searchQuery)
			.then(response => {
				if (response.status === 200) {
					setResponse('');
				} else {
					setResponse('No results found.');
				}
				return response.json();
			})
			.then(data => {
				setList(data.map((item: any) => {
					item.selected = false;
					return item;
				}));
			});
		}, 0);
	}

	return (
		<Container>
			<InputGroup className="mb-3">
				<Form.Control type="text" placeholder="Search" onChange={onSearchQueryChange} />
				<Button variant="outline-secondary" id="button-addon2" onClick={onSearchClick}> Search </Button>
			</InputGroup>

			<Table striped bordered hover responsive>
				<thead>
					<tr>
						<th>*</th>
						<th>Pic</th>
						<th>Name</th>
						<th>Price</th>
						<th>Store</th>
					</tr>
				</thead>
				<tbody>
					{list.map((item, index) => {
						return (
							<tr key={index}>
								<td><Form.Check type="checkbox" onChange={(event: any) => {
									setList(list.map((item2, index2) => {
										if (index2 === index) {
											item2.selected = event.target.checked;
										}
										return item2;
									}
									));
								}} /></td>
								<td><Image src={item.imageUrl} thumbnail style={{ width: '100px', height: '100px', overflow: 'hidden', objectFit: 'cover' }} /></td>
								<td>{item.name}</td>
								<td>{item.price} RON</td>
								<td>{item.store}</td>
							</tr>
						);
					})}
				</tbody>
			</Table>
			{response} <br />
			<Button variant="primary" onClick={onAddClick}>Add</Button>


		</Container>
	);
};

export default ProductAdder;