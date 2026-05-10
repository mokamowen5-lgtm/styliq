import { Controller, Get, Param, Query, UseGuards, Req } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { Public } from "../auth/decorators/public.decorator"
import { ProductsService } from "./products.service"
import type { Request } from "express"

@ApiTags("products")
@Controller({ path: "products", version: "1" })
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "List products" })
  list(
    @Query("page") page = 1,
    @Query("limit") limit = 24,
    @Query("category") category?: string,
    @Query("style") style?: string,
    @Query("minPrice") minPrice?: number,
    @Query("maxPrice") maxPrice?: number,
    @Query("brand") brand?: string,
    @Query("sort") sort?: "newest" | "popular" | "price_asc" | "price_desc"
  ) {
    return this.products.list({
      page: Number(page),
      limit: Number(limit),
      category,
      style,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      brand,
      sort,
    })
  }

  @Get("search")
  @Public()
  @ApiOperation({ summary: "Search products" })
  search(@Query("q") q: string, @Query("limit") limit = 20) {
    return this.products.search(q, Number(limit))
  }

  @Get("recommendations")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get personalized product recommendations" })
  recommendations(@Req() req: Request & { user: { sub: string } }) {
    return this.products.getRecommendations(req.user.sub)
  }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Get product by ID" })
  findOne(@Param("id") id: string) {
    return this.products.findOne(id)
  }
}
